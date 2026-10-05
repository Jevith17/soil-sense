#include <Arduino.h>
#include "config.h"
#include "sensors.h"
#include "sensor_health.h"
#include "pump_controller.h"
#include "communication.h"
#include "status_led.h"

static unsigned long lastTelemetryMs = 0;
static unsigned long lastPollMs = 0;

void setup() {
    Serial.begin(115200);
    delay(500);

    Serial.println("\n==================================================");
    Serial.printf("   SOILSENSE ESP32 FIRMWARE v%s\n", FIRMWARE_VERSION);
    Serial.printf("   Device ID: %s\n", DEVICE_ID);
    Serial.println("   Authoritative Framework v3 Implementation");
    Serial.println("==================================================");

    initStatusLed();
    setLedPattern(LED_SLOW_BLINK);

    // 1. Initialize Relay Driver First (Ensures Relay is OFF at Boot)
    initPumpController();

    // 2. Initialize Physical Sensors
    initSensors();
    Serial.println("[SYSTEM] Sensors initialized: Soil Capacitive, DS18B20, DHT22.");

    // 3. Connect to Local Wi-Fi Network
    initWiFi();

    Serial.println("[SYSTEM] Boot sequence complete. Entering process loop.\n");
}

void loop() {
    unsigned long now = millis();

    // 1. Core State Machine Updates (Non-blocking)
    checkWiFiConnection();
    updatePumpController();
    updateStatusLed();

    // Check for direct hardware bench test commands from USB serial
    if (Serial.available()) {
        String line = Serial.readStringUntil('\n');
        line.trim();
        if (line == "TEST_PUMP" || line == "TEST_RELAY") {
            Serial.println("\n[BENCH TEST] Actuating physical relay on GPIO 5 for 3 seconds...");
            digitalWrite(PIN_RELAY_PUMP, LOW); // Active LOW -> Relay ON
            digitalWrite(PIN_STATUS_LED, HIGH);
            delay(3000);
            digitalWrite(PIN_RELAY_PUMP, HIGH); // Active LOW -> Relay OFF
            digitalWrite(PIN_STATUS_LED, LOW);
            Serial.println("[BENCH TEST] Physical test complete. Relay restored to HIGH (OFF).\n");
        }
    }

    // Update LED pattern based on pump state
    if (isPumpRunning()) {
        setLedPattern(LED_FAST_BLINK);
    } else {
        setLedPattern(LED_SLOW_BLINK);
    }

    // 2. Deliver Pending Acknowledgements (Retries if network dropped)
    if (hasPendingAck()) {
        String ackJson = getPendingAckJson();
        if (transmitAck(ackJson)) {
            clearPendingAck();
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

        // In-flight safety interlock: If pump is ON and a critical sensor faults, trip emergency shutoff
        if (isPumpRunning() && health.overall_status == "FAULT") {
            emergencyStopPump("Critical sensor fault detected during active irrigation");
        }

        sendTelemetry(readings, health);
    }

    // 4. Command Polling Loop (Only if idle and no command active)
    if (!isPumpRunning() && (now - lastPollMs >= POLL_COMMAND_INTERVAL_MS)) {
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

    delay(10); // Minimal yield for ESP32 FreeRTOS watchdog
}
