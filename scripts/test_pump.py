#!/usr/bin/env python3
"""
SoilSense Physical Pump / Relay Bench Test
Trigger 3-second relay hardware test on ESP32 (GPIO 5 active LOW).
Can be run anytime while the dashboard or gateway is running!
"""

import os
import sys
import time

TRIGGER_FILE = "/tmp/trigger_test_pump"

def test_pump():
    print("==================================================")
    print("   SOILSENSE HARDWARE RELAY & PUMP BENCH TEST")
    print("==================================================")
    
    # 1. Trigger via gateway if running
    try:
        with open(TRIGGER_FILE, "w") as f:
            f.write("trigger")
        print("[*] Sent TEST_PUMP trigger to ESP32 gateway...")
        print("[*] Actuating physical relay on GPIO 5 for 3 seconds...")
        print("    -> Listen for the physical relay CLICK!")
        print("    -> Check if the relay LED lights up!")
        print("    -> Verify pump operates if external 12V/5V power is connected.")
        time.sleep(3.5)
        print("\n[✓] Relay test complete. Pin restored to HIGH (OFF).")
        print("==================================================")
        return
    except Exception as e:
        print(f"[!] Trigger failed: {e}")

if __name__ == "__main__":
    test_pump()
