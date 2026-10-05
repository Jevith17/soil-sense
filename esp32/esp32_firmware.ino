/*
 * ============================================================================
 * SOILSENSE ESP32 EDGE FIRMWARE (Framework v3 Production Release)
 * Model: ESP32 DevKit V1 (30-pin / 36-pin) / WROOM-32
 *
 * SENSORS & PINOUTS:
 *  1. Capacitive Soil Moisture Sensor (Analog): GPIO 34 (ADC1_CH6 - Input only)
 *  2. DS18B20 Soil Temperature Probe:          GPIO 4  (1-Wire, 4.7kΩ pull-up to 3.3V)
 *  3. DHT22 Air Temperature & Humidity:        GPIO 15
 *  4. 1-Channel Relay Module (Submersible DC): GPIO 5  (Active LOW: LOW = ON, HIGH = OFF)
 *  5. Status / Telemetry Diagnostic LED:       GPIO 2  (Built-in Blue LED)
 *
 * ARCHITECTURAL MANDATES:
 *  - ESP32 NEVER autonomously decides to irrigate or fertigate.
 *  - Closed-loop control: Sensing -> Wi-Fi -> Backend -> ML/Safety -> Human Operator Approval -> Command -> ESP32 Local Timer -> Relay -> Ack -> Feedback.
 *  - Non-blocking state machine with local timer execution (independent of Wi-Fi drops during pulse).
 *  - Hard Caps: MAX_ON_S = 60s, MAX_EVENTS = 6. Replay protection on approval_id.
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHTesp.h>

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
#define FIRMWARE_VERSION        "1.0.0"
#define DEVICE_ID               "esp32-01"
#define DEVICE_API_KEY          "esp32-secure-token-agrichem-2026"

// Wi-Fi & Backend Endpoint (Change to match your local setup)
#define WIFI_SSID               "SOILSENSE_WLAN"
#define WIFI_PASSWORD           "SoilSense2026Pass"
#define BACKEND_BASE_URL        "http://172.17.99.167:8000/api"

// Hardware Pinout Definitions
#define PIN_SOIL_MOISTURE_ADC   34
#define PIN_DS18B20             4
#define PIN_DHT22               15
#define PIN_RELAY_PUMP          5
#define PIN_STATUS_LED          2

// Soil Moisture Calibration Constants
#define CALIB_AIR_ADC           3300
#define CALIB_WATER_ADC         1400
#define ADC_DISCONNECTED_MIN    500
#define ADC_DISCONNECTED_MAX    3850

// Safety Limits & Hard Caps
#define MAX_ON_S                60
#define MAX_EVENTS              6
#define TELEMETRY_INTERVAL_MS   10000
#define POLL_COMMAND_INTERVAL_MS 4000

// ============================================================================
// GLOBAL OBJECTS & DATA STRUCTURES
// ============================================================================
static OneWire oneWire(PIN_DS18B20);
static DallasTemperature ds18b20(&oneWire);
static DHTesp dht;

struct SensorReadings {
    int   moisture_raw;
    float moisture;
    bool  moisture_valid;
    float soil_temp;
    bool  soil_temp_valid;
    float air_temp;
    bool  air_temp_valid;
    float humidity;
    bool  humidity_valid;
};

struct EdgeHealthReport {
    String moisture_status;
    String soil_temp_status;
    String air_temp_status;
    String humidity_status;
    String overall_status;
};

struct ExecutionCommand {
    String approval_id;
    int    channel;
    float  duration_s;
    int    events;
    float  interval_s;
};

enum PumpState {
    PUMP_IDLE,
    PUMP_BURST_ON,
    PUMP_BURST_INTERVAL_WAIT
};

enum LedPattern {
    LED_SLOW_BLINK,
    LED_FAST_BLINK
};

// Replay Protection & Ack Queues
#define MAX_HISTORY_IDS 10
#define MAX_QUEUED_ACKS 6

static String executedApprovalIds[MAX_HISTORY_IDS];
static int executedIdCount = 0;

static String ackQueue[MAX_QUEUED_ACKS];
static int ackQueueHead = 0;
static int ackQueueTail = 0;
static int ackQueueCount = 0;

// State Machine Variables
static PumpState currentPumpState = PUMP_IDLE;
static ExecutionCommand activeCmd;
static int currentEvent = 0;
static unsigned long burstStartMs = 0;
static unsigned long burstDurationMs = 0;
static unsigned long intervalStartMs = 0;
static unsigned long intervalDurationMs = 0;

static unsigned long lastTelemetryMs = 0;
static unsigned long lastPollMs = 0;
static unsigned long lastLedToggleMs = 0;
static bool ledState = false;

// ============================================================================
// ACK QUEUE MANAGEMENT
// ============================================================================
void queueAck(const String& approval_id, int event_no, const String& status, unsigned long actual_on_ms, const String& reason) {
    if (ackQueueCount >= MAX_QUEUED_ACKS) {
        ackQueueHead = (ackQueueHead + 1) % MAX_QUEUED_ACKS;
        ackQueueCount--;
    }

    StaticJsonDocument<256> doc;
    doc["approval_id"] = approval_id;
    doc["device_id"] = DEVICE_ID;
    doc["event_no"] = event_no;
    doc["status"] = status;
    doc["actual_on_ms"] = actual_on_ms;
    doc["reason"] = reason;

    String jsonStr;
    serializeJson(doc, jsonStr);

    ackQueue[ackQueueTail] = jsonStr;
    ackQueueTail = (ackQueueTail + 1) % MAX_QUEUED_ACKS;
    ackQueueCount++;

    Serial.printf("[ACK QUEUED] approval_id=%s status=%s event=%d actual_on=%lums\n", 
                  approval_id.c_str(), status.c_str(), event_no, actual_on_ms);
}

bool transmitAck(const String& ackJson) {
    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + "/ack";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Id", DEVICE_ID);
    http.addHeader("X-Api-Key", DEVICE_API_KEY);

    int httpCode = http.POST(ackJson);
    bool ok = (httpCode >= 200 && httpCode < 300);

    if (ok) {
        Serial.printf("[ACK SENT] 200 OK -> %s\n", ackJson.c_str());
    } else {
        Serial.printf("[ACK FAILED] HTTP %d: %s\n", httpCode, ackJson.c_str());
    }

    http.end();
    return ok;
}

// ============================================================================
// PUMP CONTROLLER & HARDWARE INTERLOCKS
// ============================================================================
void initPumpController() {
    digitalWrite(PIN_RELAY_PUMP, HIGH); // Active LOW: HIGH = OFF
    pinMode(PIN_RELAY_PUMP, OUTPUT);
    digitalWrite(PIN_RELAY_PUMP, HIGH);
    currentPumpState = PUMP_IDLE;
}

bool startCommandExecution(const ExecutionCommand& cmd, String& rejectReason) {
    if (cmd.approval_id.length() == 0) {
        rejectReason = "Empty approval ID";
        return false;
    }
    for (int i = 0; i < executedIdCount; i++) {
        if (executedApprovalIds[i] == cmd.approval_id) {
            rejectReason = "Replay violation: approval_id already executed";
            queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
            return false;
        }
    }
    if (cmd.duration_s > MAX_ON_S) {
        rejectReason = "Safety hard cap exceeded: duration exceeds MAX_ON_S (60s)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }
    if (cmd.events > MAX_EVENTS) {
        rejectReason = "Safety hard cap exceeded: events exceed MAX_EVENTS (6)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }
    if (cmd.duration_s <= 0.0f) {
        rejectReason = "Invalid duration (<= 0)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }

    executedApprovalIds[executedIdCount % MAX_HISTORY_IDS] = cmd.approval_id;
    if (executedIdCount < MAX_HISTORY_IDS) executedIdCount++;

    activeCmd = cmd;
    currentEvent = 1;
    burstDurationMs = (unsigned long)(cmd.duration_s * 1000.0f);
    intervalDurationMs = (unsigned long)(cmd.interval_s * 1000.0f);

    digitalWrite(PIN_RELAY_PUMP, LOW); // Active LOW -> Relay ON
    burstStartMs = millis();
    currentPumpState = PUMP_BURST_ON;

    Serial.printf("[PUMP START] Approval=%s Event=1/%d Duration=%.1fs\n",
                  activeCmd.approval_id.c_str(), activeCmd.events, activeCmd.duration_s);
    return true;
}

void emergencyStopPump(const String& reason) {
    digitalWrite(PIN_RELAY_PUMP, HIGH); // Relay OFF
    unsigned long actualOn = 0;
    if (currentPumpState == PUMP_BURST_ON) {
        actualOn = millis() - burstStartMs;
    }
    currentPumpState = PUMP_IDLE;
    Serial.printf("[EMERGENCY STOP] %s (Actual ON: %lu ms)\n", reason.c_str(), actualOn);

    if (activeCmd.approval_id.length() > 0) {
        queueAck(activeCmd.approval_id, currentEvent, "ABORTED_FAULT", actualOn, reason);
    }
}

void updatePumpController() {
    unsigned long now = millis();

    switch (currentPumpState) {
        case PUMP_IDLE:
            digitalWrite(PIN_RELAY_PUMP, HIGH);
            break;

        case PUMP_BURST_ON:
            if (now - burstStartMs >= burstDurationMs) {
                digitalWrite(PIN_RELAY_PUMP, HIGH);
                unsigned long actualOn = now - burstStartMs;

                queueAck(activeCmd.approval_id, currentEvent, "EVENT_DONE", actualOn, "Pulse event completed");

                if (currentEvent >= activeCmd.events) {
                    queueAck(activeCmd.approval_id, currentEvent, "COMPLETED", actualOn, "Prescription complete");
                    currentPumpState = PUMP_IDLE;
                    Serial.println("[PUMP COMPLETED] All prescription events finished.");
                } else {
                    currentEvent++;
                    intervalStartMs = millis();
                    currentPumpState = PUMP_BURST_INTERVAL_WAIT;
                    Serial.printf("[PUMP INTERVAL] Waiting %.1fs before event %d/%d\n",
                                  activeCmd.interval_s, currentEvent, activeCmd.events);
                }
            }
            break;

        case PUMP_BURST_INTERVAL_WAIT:
            if (now - intervalStartMs >= intervalDurationMs) {
                digitalWrite(PIN_RELAY_PUMP, LOW); // Relay ON
                burstStartMs = millis();
                currentPumpState = PUMP_BURST_ON;
                Serial.printf("[PUMP EVENT %d/%d] Relay ON for %.1fs\n",
                              currentEvent, activeCmd.events, activeCmd.duration_s);
            }
            break;
    }
}

// ============================================================================
// SENSOR SAMPLING & EDGE HEALTH
// ============================================================================
void initSensors() {
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    pinMode(PIN_SOIL_MOISTURE_ADC, INPUT);

    ds18b20.begin();
    ds18b20.setResolution(10);

    dht.setup(PIN_DHT22, DHTesp::DHT22);
}

SensorReadings samplePhysicalSensors() {
    SensorReadings r;

    long adcSum = 0;
    for (int i = 0; i < 10; i++) {
        adcSum += analogRead(PIN_SOIL_MOISTURE_ADC);
        delay(5);
    }
    r.moisture_raw = adcSum / 10;

    if (r.moisture_raw < ADC_DISCONNECTED_MIN || r.moisture_raw > ADC_DISCONNECTED_MAX) {
        r.moisture = NAN;
        r.moisture_valid = false;
    } else {
        float pct = ((float)(CALIB_AIR_ADC - r.moisture_raw) / (float)(CALIB_AIR_ADC - CALIB_WATER_ADC)) * 100.0f;
        if (pct < 0.0f) pct = 0.0f;
        if (pct > 100.0f) pct = 100.0f;
        r.moisture = round(pct * 10.0f) / 10.0f;
        r.moisture_valid = true;
    }

    ds18b20.requestTemperatures();
    float sTemp = ds18b20.getTempCByIndex(0);
    if (sTemp <= -55.0f || (sTemp >= 84.9f && sTemp <= 85.1f)) {
        r.soil_temp = NAN;
        r.soil_temp_valid = false;
    } else {
        r.soil_temp = round(sTemp * 10.0f) / 10.0f;
        r.soil_temp_valid = true;
    }

    TempAndHumidity dhtData = dht.getTempAndHumidity();
    if (isnan(dhtData.temperature) || dhtData.temperature < -40.0f || dhtData.temperature > 80.0f) {
        r.air_temp = NAN;
        r.air_temp_valid = false;
    } else {
        r.air_temp = round(dhtData.temperature * 10.0f) / 10.0f;
        r.air_temp_valid = true;
    }

    if (isnan(dhtData.humidity) || dhtData.humidity < 0.0f || dhtData.humidity > 100.0f) {
        r.humidity = NAN;
        r.humidity_valid = false;
    } else {
        r.humidity = round(dhtData.humidity * 10.0f) / 10.0f;
        r.humidity_valid = true;
    }

    return r;
}

EdgeHealthReport evaluateEdgeHealth(const SensorReadings& readings) {
    EdgeHealthReport rep;

    rep.moisture_status  = (!readings.moisture_valid) ? "FAULT" : ((readings.moisture < 5.0f || readings.moisture > 95.0f) ? "CHECK" : "NORMAL");
    rep.soil_temp_status = (!readings.soil_temp_valid) ? "FAULT" : ((readings.soil_temp < 0.0f || readings.soil_temp > 50.0f) ? "CHECK" : "NORMAL");
    rep.air_temp_status  = (!readings.air_temp_valid) ? "FAULT" : ((readings.air_temp < 5.0f || readings.air_temp > 48.0f) ? "CHECK" : "NORMAL");
    rep.humidity_status  = (!readings.humidity_valid) ? "FAULT" : ((readings.humidity < 10.0f || readings.humidity > 95.0f) ? "CHECK" : "NORMAL");

    if (rep.moisture_status == "FAULT" || rep.soil_temp_status == "FAULT" ||
        rep.air_temp_status == "FAULT" || rep.humidity_status == "FAULT") {
        rep.overall_status = "FAULT";
    } else if (rep.moisture_status == "CHECK" || rep.soil_temp_status == "CHECK" ||
               rep.air_temp_status == "CHECK" || rep.humidity_status == "CHECK") {
        rep.overall_status = "CHECK";
    } else {
        rep.overall_status = "NORMAL";
    }

    return rep;
}

// ============================================================================
// WI-FI & TELEMETRY COMMUNICATION
// ============================================================================
void initWiFi() {
    Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WIFI] Connected! IP: %s | RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else {
        Serial.println("\n[WIFI] Connection timed out. Reconnecting asynchronously in loop.");
    }
}

void checkWiFiConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        static unsigned long lastReconnectMs = 0;
        if (millis() - lastReconnectMs > 10000) {
            lastReconnectMs = millis();
            Serial.println("[WIFI] Reconnecting...");
            WiFi.reconnect();
        }
    }
}

bool sendTelemetry(const SensorReadings& readings, const EdgeHealthReport& health) {
    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + "/sensor-data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Id", DEVICE_ID);
    http.addHeader("X-Api-Key", DEVICE_API_KEY);

    StaticJsonDocument<512> doc;
    doc["device_id"] = DEVICE_ID;
    doc["uptime_s"] = millis() / 1000;
    doc["firmware_version"] = FIRMWARE_VERSION;
    doc["moisture_raw"] = readings.moisture_raw;

    if (readings.moisture_valid) doc["moisture"] = readings.moisture;
    else doc["moisture"] = nullptr;

    if (readings.soil_temp_valid) doc["soil_temp"] = readings.soil_temp;
    else doc["soil_temp"] = nullptr;

    if (readings.air_temp_valid) doc["air_temp"] = readings.air_temp;
    else doc["air_temp"] = nullptr;

    if (readings.humidity_valid) doc["humidity"] = readings.humidity;
    else doc["humidity"] = nullptr;

    JsonObject hObj = doc.createNestedObject("sensor_health");
    hObj["moisture"] = health.moisture_status;
    hObj["soil_temp"] = health.soil_temp_status;
    hObj["air_temp"] = health.air_temp_status;
    hObj["humidity"] = health.humidity_status;

    doc["overall_health"] = health.overall_status;
    doc["data_source"] = "REAL";

    String requestBody;
    serializeJson(doc, requestBody);

    int httpCode = http.POST(requestBody);
    bool success = (httpCode >= 200 && httpCode < 300);
    http.end();
    return success;
}

bool pollBackendCommand(ExecutionCommand& outCmd, bool& commandAvailable) {
    commandAvailable = false;
    if (WiFi.status() != WL_CONNECTED) return false;

    HTTPClient http;
    String url = String(BACKEND_BASE_URL) + "/command";
    http.begin(url);
    http.addHeader("X-Device-Id", DEVICE_ID);
    http.addHeader("X-Api-Key", DEVICE_API_KEY);

    int httpCode = http.GET();
    if (httpCode >= 200 && httpCode < 300) {
        String payload = http.getString();
        StaticJsonDocument<512> doc;
        DeserializationError err = deserializeJson(doc, payload);

        if (!err) {
            bool isAvail = doc["command_available"] | false;
            String cmdStr = doc["command"] | "NONE";

            if (isAvail && (cmdStr == "PUMP_ON" || cmdStr == "IRRIGATE" || cmdStr == "FERTIGATE")) {
                outCmd.approval_id = doc["approval_id"] | "";
                outCmd.channel = doc["channel"] | 1;
                outCmd.duration_s = doc["duration_s"] | (doc["duration_seconds"] | 0.0f);
                outCmd.events = doc["events"] | 1;
                outCmd.interval_s = doc["interval_s"] | 0.0f;
                commandAvailable = true;

                Serial.printf("[POLL COMMAND] Received Approved: %s | Events: %d | Duration: %.1fs\n",
                              outCmd.approval_id.c_str(), outCmd.events, outCmd.duration_s);
            }
        }
        http.end();
        return true;
    }

    http.end();
    return false;
}

// ============================================================================
// ARDUINO SETUP & LOOP
// ============================================================================
void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n==================================================");
    Serial.printf("   SOILSENSE ESP32 FIRMWARE v%s\n", FIRMWARE_VERSION);
    Serial.printf("   Device ID: %s\n", DEVICE_ID);
    Serial.println("   Authoritative Framework v3 Implementation");
    Serial.println("==================================================");

    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);

    initPumpController();
    initSensors();
    initWiFi();

    Serial.println("[SYSTEM] Boot sequence complete. Entering process loop.\n");
}

void loop() {
    unsigned long now = millis();

    // 1. Maintain Wi-Fi and State Machines
    checkWiFiConnection();
    updatePumpController();

    // LED Pattern: Fast blink during active irrigation, slow blink when idle
    bool pumpOn = (currentPumpState == PUMP_BURST_ON);
    unsigned long blinkInterval = pumpOn ? 150 : 1000;
    if (now - lastLedToggleMs >= blinkInterval) {
        lastLedToggleMs = now;
        ledState = !ledState;
        digitalWrite(PIN_STATUS_LED, ledState ? HIGH : LOW);
    }

    // 2. Deliver Queued Acknowledgements
    if (ackQueueCount > 0) {
        String ackJson = ackQueue[ackQueueHead];
        if (transmitAck(ackJson)) {
            ackQueueHead = (ackQueueHead + 1) % MAX_QUEUED_ACKS;
            ackQueueCount--;
        }
    }

    // 3. Sensor Telemetry Publishing Loop
    if (now - lastTelemetryMs >= TELEMETRY_INTERVAL_MS) {
        lastTelemetryMs = now;

        SensorReadings readings = samplePhysicalSensors();
        EdgeHealthReport health = evaluateEdgeHealth(readings);

        Serial.printf("[TELEMETRY] Moisture: %.1f%% (raw %d) | SoilTemp: %.1fC | AirTemp: %.1fC | RH: %.1f%% | Health: %s\n",
                      readings.moisture_valid ? readings.moisture : -1.0f,
                      readings.moisture_raw,
                      readings.soil_temp_valid ? readings.soil_temp : -99.0f,
                      readings.air_temp_valid ? readings.air_temp : -99.0f,
                      readings.humidity_valid ? readings.humidity : -1.0f,
                      health.overall_status.c_str());

        // In-flight safety trip: If pump is running and any sensor trips FAULT, abort
        if (pumpOn && health.overall_status == "FAULT") {
            emergencyStopPump("Critical sensor fault detected during active irrigation");
        }

        sendTelemetry(readings, health);
    }

    // 4. Command Polling Loop (Only if pump is idle)
    if (currentPumpState == PUMP_IDLE && (now - lastPollMs >= POLL_COMMAND_INTERVAL_MS)) {
        lastPollMs = now;

        ExecutionCommand cmd;
        bool commandAvailable = false;
        if (pollBackendCommand(cmd, commandAvailable) && commandAvailable) {
            String rejectReason;
            bool started = startCommandExecution(cmd, rejectReason);
            if (!started) {
                Serial.printf("[COMMAND REJECTED] %s\n", rejectReason.c_str());
            }
        }
    }

    delay(10); // FreeRTOS yield
}
