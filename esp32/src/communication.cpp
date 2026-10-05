#include "communication.h"
#include "config.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

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
        Serial.println("\n[WIFI] Initial connection timed out. Will retry asynchronously in loop.");
    }
}

void checkWiFiConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        static unsigned long lastReconnectMs = 0;
        if (millis() - lastReconnectMs > 10000) {
            lastReconnectMs = millis();
            wl_status_t st = WiFi.status();
            const char* stStr = (st == WL_NO_SSID_AVAIL) ? "SSID_NOT_FOUND" :
                                (st == WL_CONNECT_FAILED) ? "AUTH_FAILED" :
                                (st == WL_CONNECTION_LOST) ? "CONN_LOST" :
                                (st == WL_DISCONNECTED) ? "DISCONNECTED" : "IDLE";
            Serial.printf("[WIFI] Status: %s (%d). Reconnecting to %s...\n", stStr, (int)st, WIFI_SSID);
            WiFi.disconnect();
            WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
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

    if (readings.moisture_valid) {
        doc["moisture"] = readings.moisture;
    } else {
        doc["moisture"] = nullptr;
    }

    if (readings.soil_temp_valid) {
        doc["soil_temp"] = readings.soil_temp;
    } else {
        doc["soil_temp"] = nullptr;
    }

    if (readings.air_temp_valid) {
        doc["air_temp"] = readings.air_temp;
    } else {
        doc["air_temp"] = nullptr;
    }

    if (readings.humidity_valid) {
        doc["humidity"] = readings.humidity;
    } else {
        doc["humidity"] = nullptr;
    }

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

    if (success) {
        Serial.printf("[TELEMETRY] POST 200 OK -> %s\n", url.c_str());
    } else {
        Serial.printf("[TELEMETRY] POST Failed (%d): %s\n", httpCode, http.errorToString(httpCode).c_str());
    }

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
