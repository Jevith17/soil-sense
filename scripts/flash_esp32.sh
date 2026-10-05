#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PIO_BIN="$PROJECT_ROOT/venv/bin/pio"

echo "=================================================="
echo "      SOILSENSE ESP32 FLASHER & MONITOR"
echo "=================================================="

# Check if PlatformIO is installed
if [ ! -f "$PIO_BIN" ]; then
    echo "[!] PlatformIO not found in venv. Installing..."
    "$PROJECT_ROOT/venv/bin/pip" install platformio
fi

# Detect serial port
PORTS=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true)

if [ -z "$PORTS" ]; then
    echo ""
    echo "[?] No USB serial device detected (/dev/ttyUSB* or /dev/ttyACM*)."
    echo "    1. Plug your ESP32 into a USB port on this computer."
    echo "    2. Ensure your micro-USB / USB-C cable supports DATA (not a charge-only cable)."
    echo ""
    echo "Waiting for ESP32 to be plugged in... (Press Ctrl+C to cancel)"
    while [ -z "$PORTS" ]; do
        sleep 1
        PORTS=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null || true)
    done
fi

TARGET_PORT=$(echo "$PORTS" | head -n 1)
echo "[+] Detected ESP32 device at: $TARGET_PORT"

# Check write permissions on the serial port
if [ ! -w "$TARGET_PORT" ]; then
    echo ""
    echo "[!] Permission denied on $TARGET_PORT (Arch Linux uses group 'uucp')."
    echo "    Fixing permissions with sudo (you may be prompted for your password)..."
    sudo chmod 666 "$TARGET_PORT"
fi

cd "$PROJECT_ROOT/esp32"

echo "[*] Flashing firmware to $TARGET_PORT..."
"$PIO_BIN" run --target upload --upload-port "$TARGET_PORT"

echo ""
echo "[✓] FLASH COMPLETED SUCCESSFULLY!"
echo ""
read -p "Would you like to open the Serial Monitor now? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "[*] Opening serial monitor at 115200 baud (Press Ctrl+C to exit)..."
    "$PIO_BIN" device monitor --port "$TARGET_PORT" --baud 115200
fi
