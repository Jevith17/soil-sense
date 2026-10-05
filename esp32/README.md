# SoilSense ESP32 Firmware (Framework v3)

This directory contains the production firmware for the **SoilSense** ESP32 node. It runs as an autonomous, edge-sensing and safe execution node adhering to the **SoilSense AI Hardware Framework v3** specification.

---

## Hardware Architecture & Pinout

| Subsystem / Device           | Sensor / Actuator Model              | ESP32 GPIO | Interface / Specifications                              |
| :--------------------------- | :----------------------------------- | :--------- | :------------------------------------------------------ |
| **Soil Moisture**            | Capacitive Soil Moisture Sensor v1.2 | `GPIO 34`  | ADC1_CH6 (Input-only, 12-bit ADC, 0 - 3.3V)             |
| **Soil Temperature**         | DS18B20 Waterproof Probe             | `GPIO 4`   | 1-Wire bus (requires **4.7 kΩ pull-up** to 3.3V)        |
| **Air Temp & Humidity**      | DHT22 (AM2302)                       | `GPIO 15`  | Digital single-bus with internal pull-up                |
| **Water / Fertigation Pump** | 1-Channel Relay Module               | `GPIO 5`   | Active-LOW logic (`LOW` = Relay ON, `HIGH` = Relay OFF) |
| **Diagnostic LED**           | Built-in Blue LED                    | `GPIO 2`   | Pulse diagnostic indicator                              |

> [!IMPORTANT]
> **Relay Safety Invariant**: The relay drive pin (`GPIO 5`) is initialized `HIGH` before pin mode setup to prevent brief relay closures ("boot blip") when the ESP32 resets.
>
> **Autonomous Decision Ban**: The ESP32 **never** decides autonomously when to irrigate or fertigate. Actuation happens only after backend process modeling, safety interlock checks, and human operator approval.

---

## Directory Structure

```
esp32/
├── platformio.ini              # PlatformIO build configuration & dependency manifest
├── include/                    # Header files
│   ├── config.h                # Pin definitions, calibration thresholds, hard caps
│   ├── sensors.h               # Physical sensor structs and prototypes
│   ├── sensor_health.h         # Edge sensor validation and fault detection
│   ├── pump_controller.h      # Non-blocking pump state machine & ack queue
│   ├── communication.h        # Wi-Fi management, telemetry POST, and command poll
│   └── status_led.h           # Diagnostic LED pattern controller
├── src/                        # Modular C++ implementation
│   ├── main.cpp                # Setup and non-blocking event loop
│   ├── sensors.cpp             # Analog & 1-Wire sampling drivers
│   ├── sensor_health.cpp       # Threshold checks (ADC bounds, NaN, disconnects)
│   ├── pump_controller.cpp     # Multi-pulse timed execution & replay protection
│   ├── communication.cpp       # HTTPClient communication with SoilSense backend
│   └── status_led.cpp          # LED driver
├── esp32_firmware.ino          # Unified single-file sketch for Arduino IDE
└── README.md                   # This guide
```

---

## Flashing Instructions

### Option A: Using PlatformIO (Recommended)

1. Install [PlatformIO Core](https://platformio.org/) or the PlatformIO IDE extension in VS Code.
2. Edit `include/config.h` (or set environment variables) to configure your Wi-Fi SSID, password, and backend server URL:
   ```c
   #define WIFI_SSID         "Your_WiFi_SSID"
   #define WIFI_PASSWORD     "Your_WiFi_Password"
   #define BACKEND_BASE_URL  "http://<YOUR_BACKEND_IP>:8000/api"
   ```
3. Connect your ESP32 via Micro-USB / USB-C.
4. Compile and flash:
   ```bash
   pio run --target upload
   ```
5. Monitor serial logs at 115200 baud:
   ```bash
   pio device monitor
   ```

---

### Option B: Using Arduino IDE

1. Open the [Arduino IDE](https://www.arduino.cc/en/software) (version 2.0+ recommended).
2. Install the **esp32** board package by Espressif:
   - Go to `File` -> `Preferences` -> `Additional Boards Manager URLs`.
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
   - Open `Tools` -> `Board` -> `Boards Manager`, search for `esp32`, and click **Install**.
3. Install required libraries via `Tools` -> `Manage Libraries`:
   - `ArduinoJson` (by Benoit Blanchon, version 6.x)
   - `OneWire` (by Paul Stoffregen)
   - `DallasTemperature` (by Miles Burton)
   - `DHT sensor library for ESPx` (by beegee_tokyo)
4. Open `esp32/esp32_firmware.ino`.
5. Adjust `WIFI_SSID`, `WIFI_PASSWORD`, and `BACKEND_BASE_URL` in the config section.
6. Select your board under `Tools` -> `Board` -> `ESP32 Arduino` -> `ESP32 Dev Module`.
7. Select your serial port under `Tools` -> `Port`.
8. Click **Upload**.

---

## Calibration Guide

### Capacitive Soil Moisture Sensor

1. **Dry Air Calibration**:
   - Hold sensor in air (completely dry).
   - Read the serial monitor: Note the raw ADC value (typically ~3200–3500).
   - Update `CALIB_AIR_ADC` in `config.h`.
2. **Submerged Water Calibration**:
   - Immerse probe in a cup of tap water up to the white line (do NOT submerge electronics).
   - Note the raw ADC value (typically ~1300–1600).
   - Update `CALIB_WATER_ADC` in `config.h`.

---

## Safety Features Enforced on Hardware

- **Replay Protection**: The ESP32 tracks the last 10 executed `approval_id` strings and rejects duplicated tokens.
- **Hardware Max Runtime (`MAX_ON_S = 60s`)**: Hard cap prevents runaway pump actuation even if backend sends a larger value.
- **Hardware Max Pulses (`MAX_EVENTS = 6`)**: Maximum pulse count prevents continuous cycling.
- **Fail-Safe Relay De-energize**: Any sensor FAULT detected while pump is running triggers an instant `emergencyStopPump()` and logs `ABORTED_FAULT`.
- **Local Timer Reliability**: The execution duration is timed strictly with `millis()` on the ESP32. If Wi-Fi drops while the pump is ON, the pump will still turn OFF exactly when the timer expires.
