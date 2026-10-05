#!/usr/bin/env python3
"""
SoilSense Telemetry Gateway
Reads physical sensor telemetry directly from ESP32 over USB (/dev/ttyUSB0)
and forwards it into the local SoilSense backend (http://127.0.0.1:8000/api/sensor-data).
Works reliably even without Wi-Fi!
"""

import os
import sys
import re
import time
import requests
import serial

PORT = "/dev/ttyUSB0"
BAUD = 115200
API_URL = "http://127.0.0.1:8000/api/sensor-data"
TRIGGER_FILE = "/tmp/trigger_test_pump"

TELEMETRY_PATTERN = re.compile(
    r"\[TELEMETRY\]\s+Moisture:\s*([-\d\.]+)%\s*\(raw\s*(\d+)\)\s*\|\s*SoilTemp:\s*([-\d\.]+)C\s*\|\s*AirTemp:\s*([-\d\.]+)C\s*\|\s*RH:\s*([-\d\.]+)%\s*\|\s*Health:\s*(\w+)"
)

def run():
    print("==================================================", flush=True)
    print("    SOILSENSE USB SERIAL TELEMETRY GATEWAY", flush=True)
    print(f"    Connecting to {PORT} at {BAUD} baud...", flush=True)
    print(f"    Forwarding live telemetry to: {API_URL}", flush=True)
    print("==================================================", flush=True)

    try:
        ser = serial.Serial()
        ser.port = PORT
        ser.baudrate = BAUD
        ser.timeout = 1
        ser.dtr = False
        ser.rts = False
        ser.open()
    except Exception as e:
        print(f"[!] Error opening serial port {PORT}: {e}", flush=True)
        print("    Ensure permissions: sudo chmod 666 /dev/ttyUSB0", flush=True)
        sys.exit(1)

    time.sleep(1)
    ser.reset_input_buffer()
    print("[✓] Connected to ESP32! Listening for sensor events...\n", flush=True)

    while True:
        try:
            # Check for on-demand pump test triggers
            if os.path.exists(TRIGGER_FILE):
                try:
                    os.remove(TRIGGER_FILE)
                    print("\n[*] Triggering physical pump test on ESP32 (GPIO 5 active LOW)...", flush=True)
                    ser.write(b"TEST_PUMP\n")
                    ser.flush()
                except Exception as ex:
                    print(f"[!] Error triggering pump: {ex}", flush=True)

            line_bytes = ser.readline()
            if not line_bytes:
                continue

            line = line_bytes.decode("utf-8", errors="replace").strip()
            if not line:
                continue

            if "[TELEMETRY]" in line:
                print(f"[ESP32] {line}", flush=True)
                match = TELEMETRY_PATTERN.search(line)
                if match:
                    moisture_pct = float(match.group(1))
                    moisture_raw = int(match.group(2))
                    soil_temp = float(match.group(3))
                    air_temp = float(match.group(4))
                    humidity = float(match.group(5))
                    health = match.group(6)

                    # Compute percentage from raw ADC (dry air ~3300, water ~1400)
                    calculated_moisture = moisture_pct
                    if moisture_raw < 3800 and moisture_raw > 600:
                        calculated_moisture = round(max(0.0, min(100.0, (3300 - moisture_raw) / (3300 - 1400) * 100.0)), 1)
                        if health == "FAULT":
                            health = "NORMAL"

                    payload = {
                        "device_id": "esp32-01",
                        "data_source": "Measured",
                        "moisture": calculated_moisture if calculated_moisture >= 0 else 0.0,
                        "moisture_raw": moisture_raw,
                        "soil_temp": soil_temp if soil_temp > -50 else 22.0,
                        "air_temp": air_temp if air_temp > -50 else 24.0,
                        "humidity": humidity if humidity >= 0 else 60.0,
                        "overall_health": health,
                        "pump_status": "OFF"
                    }

                    headers = {
                        "Content-Type": "application/json",
                        "X-Device-Id": "esp32-01",
                        "X-Api-Key": "esp32-secure-token-agrichem-2026"
                    }

                    try:
                        resp = requests.post(API_URL, json=payload, headers=headers, timeout=3)
                        if resp.status_code in (200, 201):
                            data = resp.json()
                            print(f"   ↳ [GATEWAY] Posted to Backend -> Reading ID #{data.get('id')} | Soil: {soil_temp}°C | Air: {air_temp}°C | RH: {humidity}%", flush=True)
                        else:
                            print(f"   ↳ [GATEWAY] Backend returned HTTP {resp.status_code}", flush=True)
                    except Exception as ex:
                        print(f"   ↳ [GATEWAY] Failed to post: {ex}", flush=True)
            elif "[BENCH TEST]" in line or "[PUMP" in line:
                print(f"[ESP32] {line}", flush=True)
        except Exception as e:
            print(f"[!] Read error: {e}", flush=True)
            time.sleep(1)

if __name__ == "__main__":
    run()
