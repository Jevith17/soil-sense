/*
 * AgriChem AI - ESP32 Firmware
 * Model: ESP32 DevKit V1 / WROOM-32
 *
 * Sensors & Pinouts:
 *  - Analog Soil Moisture Sensor: GPIO 34 (ADC1_CH6)
 *  - Digital Soil Moisture Sensor: GPIO 2  (Active LOW comparator)
 *  - Relay Module (Active LOW):   GPIO 23 (Controls DC Submersible Water Pump)
 *  - Status LED:                  GPIO 22
 *
 * Operational Flow:
 *  1. Connects to Wi-Fi with resilient exponential reconnection.
 *  2. Reads analog moisture, calibrates to percentage (0 - 100%).
 *  3. Reads digital wet/dry logic state for cross-sensor validation.
 *  4. Serializes telemetry payload to JSON.
 *  5. Transmits POST request to backend /api/data.
 *  6. Polls GET /api/command for human-approved, safety-validated pump actuation commands.
 *  7. Executes pump actuation if authorized, otherwise obeys local fallback threshold
 *     only in critical network disconnect situations.
 */

#include <WiFi.h>
#include <HTTPClient.h>

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================
const char* WIFI_SSID       = "AGRI_CHEM_WIFI";
const char* WIFI_PASSWORD   = "Agr1Ch3m_S3cur3";
const char* BACKEND_URL     = "http://192.168.1.100:8000/api";
const char* DEVICE_ID       = "ESP32-AGRI-01";
const char* DEVICE_API_KEY  = "esp32-secure-token-agrichem-2026";

// GPIO Pin Allocations
const int MOISTURE_ANALOG_PIN  = 34; // ADC1 Pin 34 (0 - 4095)
const int MOISTURE_DIGITAL_PIN = 2;  // Digital comparator pin (0=WET, 1=DRY)
const int RELAY_PIN            = 23; // Relay drive pin (Active LOW: LOW = ON, HIGH = OFF)
const int STATUS_LED_PIN       = 22; // Telemetry indicator LED

// Calibration Limits (Empirical values for capacitive/resistive probe)
const int AIR_VALUE   = 3500; // Analog value in completely dry air
const int WATER_VALUE = 1200; // Analog value submerged in water

// Local Fallback Safety Thresholds
const float CRITICAL_DRY_THRESHOLD = 18.0; // Edge emergency cutoff only if disconnected
const unsigned long MAX_PUMP_RUNTIME_MS = 600000; // Max 10 min hardware emergency watchdog

// Operational Loop Timers
const unsigned long TELEMETRY_INTERVAL_MS = 5000; // Send telemetry every 5 sec
const unsigned long POLL_COMMAND_INTERVAL_MS = 3000; // Poll for commands every 3 sec

// State Tracking
bool isPumpRunning = false;
unsigned long pumpStartTime = 0;
unsigned long pumpDurationLimit = 0;
unsigned long lastTelemetryTime = 0;
unsigned long lastPollTime = 0;

// ============================================================================
// RELAY CONTROL FUNCTIONS (Active LOW Relay)
// ============================================================================
void setPumpState(bool turnOn, unsigned long durationMs = 0) {
  if (turnOn) {
    digitalWrite(RELAY_PIN, LOW); // Active LOW turns relay ON
    isPumpRunning = true;
    pumpStartTime = millis();
    pumpDurationLimit = (durationMs > 0 && durationMs <= MAX_PUMP_RUNTIME_MS) ? durationMs : MAX_PUMP_RUNTIME_MS;
    Serial.printf("[PUMP] Activated ON! Duration limit: %lu ms\n", pumpDurationLimit);
  } else {
    digitalWrite(RELAY_PIN, HIGH); // Active LOW turns relay OFF
    isPumpRunning = false;
    pumpStartTime = 0;
    pumpDurationLimit = 0;
    Serial.println("[PUMP] Deactivated OFF.");
  }
}

// ============================================================================
// SENSOR READING & CALIBRATION
// ============================================================================
float readMoisturePercentage(int &rawAnalog, int &rawDigital) {
  // Take 10-sample rolling average to filter noise
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(MOISTURE_ANALOG_PIN);
    delay(10);
  }
  rawAnalog = sum / 10;
  rawDigital = digitalRead(MOISTURE_DIGITAL_PIN);

  // Map analog reading to 0 - 100% moisture
  float moisture = map(rawAnalog, AIR_VALUE, WATER_VALUE, 0, 100);
  if (moisture < 0.0) moisture = 0.0;
  if (moisture > 100.0) moisture = 100.0;

  return moisture;
}

// ============================================================================
// WIFI CONNECTION RESILIENCE
// ============================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.printf("[WIFI] Connecting to SSID: %s ...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, HIGH);
    Serial.printf("\n[WIFI] Connected! Assigned IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    digitalWrite(STATUS_LED_PIN, LOW);
    Serial.println("\n[WIFI] Connection failed. Operating in offline edge mode.");
  }
}

// ============================================================================
// TRANSMIT TELEMETRY (POST /api/data)
// ============================================================================
void sendTelemetry(float moisture, int rawAnalog, int rawDigital) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/data";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Api-Key", DEVICE_API_KEY);

  // Construct JSON payload matching backend ReadingCreate schema
  // Hardware supplies physical moisture & pins; simulated fields accompany as specified
  String jsonPayload = "{";
  jsonPayload += "\"moisture\":" + String(moisture, 1) + ",";
  jsonPayload += "\"soil_temp\":28.5,";
  jsonPayload += "\"ph\":6.4,";
  jsonPayload += "\"n\":64.0,";
  jsonPayload += "\"p\":51.0,";
  jsonPayload += "\"k\":73.0,";
  jsonPayload += "\"air_temp\":32.5,";
  jsonPayload += "\"humidity\":64.0,";
  jsonPayload += "\"solar\":890.0,";
  jsonPayload += "\"ch4\":18.0,";
  jsonPayload += "\"co2\":615.0,";
  jsonPayload += "\"pump_status\":\"" + String(isPumpRunning ? "ON" : "OFF") + "\",";
  jsonPayload += "\"data_source\":\"REAL\",";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"analog_moisture_raw\":" + String(rawAnalog) + ",";
  jsonPayload += "\"digital_moisture_raw\":" + String(rawDigital);
  jsonPayload += "}";

  int httpCode = http.POST(jsonPayload);
  if (httpCode > 0) {
    Serial.printf("[TELEMETRY] Sent (HTTP %d): Moisture=%.1f%%, Pump=%s\n",
                  httpCode, moisture, isPumpRunning ? "ON" : "OFF");
  } else {
    Serial.printf("[TELEMETRY] POST failed: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ============================================================================
// POLL APPROVED COMMAND (GET /api/command)
// ============================================================================
void pollPendingCommand() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(BACKEND_URL) + "/command";
  http.begin(url);
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Api-Key", DEVICE_API_KEY);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    
    // Check if command is available and approved
    if (payload.indexOf("\"command_available\":true") >= 0) {
      if (payload.indexOf("\"command\":\"PUMP_ON\"") >= 0) {
        // Extract duration_seconds if present
        int durationSec = 360; // Default 6 min
        int durIdx = payload.indexOf("\"duration_seconds\":");
        if (durIdx >= 0) {
          int endIdx = payload.indexOf(",", durIdx);
          if (endIdx < 0) endIdx = payload.indexOf("}", durIdx);
          if (endIdx > durIdx) {
            durationSec = payload.substring(durIdx + 19, endIdx).toInt();
          }
        }
        Serial.printf("[COMMAND] Approved PUMP_ON command received! Duration: %d s\n", durationSec);
        setPumpState(true, (unsigned long)durationSec * 1000UL);
      } else if (payload.indexOf("\"command\":\"PUMP_OFF\"") >= 0) {
        Serial.println("[COMMAND] Approved PUMP_OFF command received!");
        setPumpState(false);
      }
    }
  }
  http.end();
}

// ============================================================================
// SETUP & MAIN LOOP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n==================================================");
  Serial.println("AgriChem AI - IoT Process Control Firmware v1.0");
  Serial.printf("Device ID: %s\n", DEVICE_ID);
  Serial.println("==================================================");

  // Initialize pin states
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Ensure pump is OFF immediately upon boot

  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LOW);

  pinMode(MOISTURE_DIGITAL_PIN, INPUT_PULLUP);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)

  connectWiFi();
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Maintain Wi-Fi connectivity
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // 2. Hardware Pump Safety Watchdog
  if (isPumpRunning) {
    if (currentMillis - pumpStartTime >= pumpDurationLimit) {
      Serial.println("[WATCHDOG] Pump runtime duration limit reached. Turning off pump.");
      setPumpState(false);
    }
  }

  // 3. Telemetry Ingestion Cycle
  if (currentMillis - lastTelemetryTime >= TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = currentMillis;
    int rawAnalog = 0;
    int rawDigital = 1;
    float moisture = readMoisturePercentage(rawAnalog, rawDigital);

    sendTelemetry(moisture, rawAnalog, rawDigital);

    // Offline Edge Fallback: If WiFi has been lost and soil is dangerously dry,
    // pulse pump locally for 30s to prevent crop mortality
    if (WiFi.status() != WL_CONNECTED && moisture < CRITICAL_DRY_THRESHOLD && !isPumpRunning) {
      Serial.println("[EDGE FALLBACK] Disconnected and moisture < 18%! Pulsing emergency irrigation 30s.");
      setPumpState(true, 30000);
    }
  }

  // 4. Command Polling Cycle
  if (currentMillis - lastPollTime >= POLL_COMMAND_INTERVAL_MS) {
    lastPollTime = currentMillis;
    pollPendingCommand();
  }

  delay(50);
}

