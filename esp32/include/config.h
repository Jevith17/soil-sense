#pragma once

#include <Arduino.h>

// ============================================================================
// SOILSENSE HARDWARE & SYSTEM CONFIGURATION (Framework v3)
// ============================================================================

// Firmware Meta
#define FIRMWARE_VERSION        "1.0.0"
#define DEVICE_ID               "esp32-01"
#define DEVICE_API_KEY          "esp32-secure-token-agrichem-2026"

// Wi-Fi & Backend Endpoint Configuration
#define WIFI_SSID               "YOUR_WIFI_SSID"
#define WIFI_PASSWORD           "YOUR_WIFI_PASSWORD"
#define BACKEND_BASE_URL        "http://YOUR_SERVER_IP:8000/api"

// Hardware Pinout Definitions (Authoritative Framework v3)
// 1. Capacitive Analog Soil Moisture Sensor: GPIO 34 (ADC1_CH6 - Input only)
#define PIN_SOIL_MOISTURE_ADC   34

// 2. DS18B20 Waterproof Soil Temperature Probe: GPIO 4 (1-Wire with 4.7kΩ pull-up to 3.3V)
#define PIN_DS18B20             4

// 3. DHT22 Air Temperature & Humidity Sensor: GPIO 15
#define PIN_DHT22               15

// 4. Single-Channel Relay Module (DC Water Pump): GPIO 5 (Active LOW: LOW = ON, HIGH = OFF)
#define PIN_RELAY_PUMP          5

// 5. Status / Telemetry Diagnostic LED: GPIO 2 (ESP32 Built-in Blue LED)
#define PIN_STATUS_LED          2

// Soil Moisture Calibration Constants (Standard 12-bit ADC: 0 - 4095)
#define CALIB_AIR_ADC           3300    // Raw reading in completely dry air (0% moisture)
#define CALIB_WATER_ADC         1400    // Raw reading submerged in pure water (100% moisture)
#define ADC_DISCONNECTED_MIN    500     // ADC < 500 indicates electrical short or GND rail
#define ADC_DISCONNECTED_MAX    3850    // ADC > 3850 indicates disconnected floating probe

// Non-Negotiable Hardware Hard Caps & Safety Limits
#define MAX_ON_S                60      // Absolute hard limit for single pump burst (seconds)
#define MAX_EVENTS              6       // Maximum number of pulse events per prescription
#define MIN_INTERVAL_S          5       // Minimum interval between successive pulses (seconds)

// Interval & Scheduling Timers
#define TELEMETRY_INTERVAL_MS   10000   // Send telemetry every 10 seconds
#define POLL_COMMAND_INTERVAL_MS 4000   // Poll command queue every 4 seconds
#define SENSOR_SAMPLE_INTERVAL_MS 2000  // Sample sensors every 2 seconds
