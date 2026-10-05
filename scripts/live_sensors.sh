#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================="
echo "    SOILSENSE LIVE SENSOR TELEMETRY TERMINAL"
echo "=================================================="

# Check port permissions on Linux
if [ -e /dev/ttyUSB0 ] && [ ! -w /dev/ttyUSB0 ]; then
    echo "[!] /dev/ttyUSB0 requires write permissions."
    echo "    Running sudo chmod 666 /dev/ttyUSB0..."
    sudo chmod 666 /dev/ttyUSB0
fi

# Run the live serial gateway and terminal viewer
cd "$PROJECT_ROOT"
"$PROJECT_ROOT/venv/bin/python" -u "$PROJECT_ROOT/scripts/telemetry_gateway.py"
