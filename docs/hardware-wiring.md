# SoilSense Hardware Wiring & Electrical Integration Guide

**Specification Compliance:** SoilSense AI Hardware Framework v3  
**Target Hardware:** ESP32 DevKit (30-pin / 36-pin) / WROOM-32  
**Document Revision:** 3.0 (Production Hardware Integration)

---

## 1. Authoritative Pinout & Wiring Table

| Component                    | Component Pin / Wire  | ESP32 Pin     | Connection Voltage | Description & Interface Notes                                       |
| :--------------------------- | :-------------------- | :------------ | :----------------- | :------------------------------------------------------------------ |
| **Capacitive Soil Moisture** | VCC                   | `3.3V`        | 3.3V DC            | Power supply (do **not** connect to 5V to avoid ADC overvoltage)    |
|                              | GND                   | `GND`         | Ground             | Common system ground                                                |
|                              | AOUT                  | `GPIO 34`     | 0 – 3.0V Analog    | ADC1 Channel 6. Input-only pin. Safe while Wi-Fi is active.         |
| **DS18B20 Temp Probe**       | Red (VDD)             | `3.3V`        | 3.3V DC            | Power lead                                                          |
|                              | Black (GND)           | `GND`         | Ground             | Ground lead                                                         |
|                              | Yellow / White (DATA) | `GPIO 4`      | 3.3V Logic         | 1-Wire Digital Bus (**Requires 4.7 kΩ pull-up resistor to 3.3V**)   |
| **DHT22 Temp / Humidity**    | Pin 1 (VCC)           | `3.3V`        | 3.3V DC            | Power lead                                                          |
|                              | Pin 2 (DATA)          | `GPIO 15`     | 3.3V Logic         | Single-wire bidirectional digital signal                            |
|                              | Pin 4 (GND)           | `GND`         | Ground             | Ground lead (Pin 3 is NC / unused)                                  |
| **1-Channel Relay Module**   | VCC                   | `VIN` or `5V` | 5.0V DC            | Power to energize relay electromagnetic coil                        |
|                              | GND                   | `GND`         | Ground             | Common ground with ESP32                                            |
|                              | IN (Signal)           | `GPIO 5`      | 3.3V Logic         | Active-LOW control (`LOW` = Relay Energized, `HIGH` = De-energized) |
| **Diagnostic LED**           | Anode (+)             | `GPIO 2`      | 3.3V Logic         | Built-in Blue LED on ESP32 DevKit                                   |
|                              | Cathode (-)           | `GND`         | Ground             | Internal onboard current-limiting resistor                          |

---

## 2. Power Isolation & External Pump Circuit Diagram

> [!CAUTION]
> **ELECTRICAL ISOLATION INVARIANT**: The DC water pump **must NEVER** be powered from the ESP32 `3.3V` or `VIN` pins. Submersible DC pumps draw substantial inrush currents (typically 500 mA to 1.5 A) and generate severe inductive back-EMF spikes that will cause instant ESP32 brownouts, CPU resets, or permanent microcontroller damage.
>
> The pump must be powered exclusively by a dedicated **External DC Power Supply** switched via the relay contacts.

### Electrical Schematic Architecture

```
  +-------------------------------------------------------------------------+
  |                           ESP32 LOGIC DOMAIN                            |
  |                                                                         |
  |   [3.3V] -----> Capacitive Moisture VCC                                 |
  |          -----> DS18B20 VDD (+ 4.7k Pull-up)                            |
  |          -----> DHT22 VCC                                               |
  |                                                                         |
  |   [GND]  -----> Common Ground Bus -------------------+                  |
  |                                                      |                  |
  |   [GPIO 34] <-- Capacitive Moisture AOUT             |                  |
  |   [GPIO 4]  <-- DS18B20 DQ (1-Wire)                  |                  |
  |   [GPIO 15] <-- DHT22 DATA                           |                  |
  |   [GPIO 5]  --> Relay Module IN (Active LOW)         |                  |
  |   [VIN / 5V]--> Relay Module VCC                     |                  |
  |   [GND]     --> Relay Module GND --------------------+                  |
  +-------------------------------------------------------------------------+
                                 | Opto-Isolation Barrier
  ===============================|===========================================
  +-------------------------------------------------------------------------+
  |                        EXTERNAL PUMP POWER DOMAIN                       |
  |                                                                         |
  |   (+) External Power Supply (12V DC)                                    |
  |          |                                                              |
  |        [FUSE: 1.5A Fast-Blow]                                           |
  |          |                                                              |
  |        [EMERGENCY KILL SWITCH]                                          |
  |          |                                                              |
  |          +---> Relay [COM] Terminal                                     |
  |                                                                         |
  |                Relay [NO] Terminal (Normally Open)                      |
  |                      |                                                  |
  |                      +---------> (+) DC Water Pump                      |
  |                                       |       ^                         |
  |                                    [PUMP]  [1N4007 Diode] (Cathode to +)|
  |                                       |       |                         |
  |                      +----------------+-------+                         |
  |                      |                                                  |
  |   (-) External Power Supply Return (GND)                                |
  +-------------------------------------------------------------------------+
```

---

## 3. Why an External Transistor is Not Needed for the Relay

Engineers frequently ask whether a discrete BJT (e.g. 2N2222) or MOSFET is required between ESP32 `GPIO 5` and the relay module.

**Answer: No external transistor is required.**

1. **Onboard Driver Stage**: Standard Arduino/ESP32 1-channel relay modules incorporate an onboard PC817 optocoupler and an onboard SMD driver transistor (SS8050 / S8550).
2. **Current Consumption**: The signal input pin (`IN`) draws only ~2 mA to 4 mA to trigger the optocoupler's infrared LED, which is well within the ESP32 GPIO pin drive capability (up to 12 mA).
3. **Galvanic Isolation**: The optocoupler optically isolates the 3.3V ESP32 microcontroller from any coil collapse voltage spikes on the 5V relay coil side.

---

## 4. Back-EMF Protection & Safety Components

1. **Flyback Diode (1N4007 / 1N5819)**:
   - Place antiparallel across the pump's positive and negative terminals (Cathode to `+`, Anode to `-`).
   - When the relay opens, the inductive collapse of the pump motor coil will safely circulate through this diode rather than arcing across the relay contacts.
2. **Inline Fuse (1.5A Fast-Blow)**:
   - Installed on the positive rail between the external battery/power supply and the relay `COM` terminal.
   - Prevents wire melting and fire in case the pump impeller jams (rotor stall condition).
3. **Physical Emergency Stop Switch**:
   - High-visibility toggle or push-lock switch in series with the external power rail.
   - Allows instant physical power shutdown without touching the software interface.

---

## 5. Critical Installation Checklist & Pitfalls to Avoid

- [x] **ADC Pin Selection**: Use `GPIO 34`. Never use ADC2 pins (GPIO 0, 2, 4, 12, 13, 14, 15, 25, 26, 27) for analog sensing, because the ESP32 Wi-Fi driver uses ADC2 internally, causing `analogRead()` calls on ADC2 to return invalid data when connected to Wi-Fi.
- [x] **DS18B20 Pull-up Resistor**: Ensure the 4.7 kΩ pull-up resistor is firmly connected between the DATA line (`GPIO 4`) and `3.3V`. Without this resistor, the 1-Wire bus cannot float high, resulting in reading failure (`-127°C`).
- [x] **Capacitive Moisture Sensor Voltage**: Power from `3.3V`. Supplying 5V will output up to 4.2V on `AOUT`, exceeding the ESP32's maximum allowable pin input voltage (3.6V).
- [x] **Active-LOW Relay Boot Glitch Prevention**: In firmware, initialize `digitalWrite(PIN_RELAY_PUMP, HIGH)` **before** `pinMode(PIN_RELAY_PUMP, OUTPUT)`. This guarantees the relay contact stays open during microcontroller reset or reboot cycles.
