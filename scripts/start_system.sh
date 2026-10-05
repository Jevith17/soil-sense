#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=================================================="
echo "          SOILSENSE SYSTEM LAUNCHER"
echo "=================================================="
echo "Project Root: $PROJECT_ROOT"

# 1. Port Permissions
if [ -e /dev/ttyUSB0 ] && [ ! -w /dev/ttyUSB0 ]; then
    echo "[!] Fixing permissions for /dev/ttyUSB0..."
    sudo chmod 666 /dev/ttyUSB0
fi

# Cleanup old background processes on ports 8000 & 3000
echo "[*] Cleaning up old processes..."
fuser -k 8000/tcp 2>/dev/null || true
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# 2. Start Backend
echo "[*] Starting SoilSense FastAPI Backend (port 8000)..."
cd "$PROJECT_ROOT/backend"
nohup "$PROJECT_ROOT/venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo "    ↳ Backend running (PID: $BACKEND_PID) -> http://127.0.0.1:8000/docs"

# Wait for backend health
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
        echo "    ↳ Backend healthy!"
        break
    fi
    sleep 0.5
done

# 3. Start Frontend
echo "[*] Starting SoilSense Next.js Frontend (port 3000)..."
cd "$PROJECT_ROOT/frontend"
nohup npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "    ↳ Frontend running (PID: $FRONTEND_PID) -> http://localhost:3000"

# 4. Check ESP32 Device
echo ""
echo "=================================================="
echo "              HARDWARE STATUS"
echo "=================================================="
if [ -e /dev/ttyUSB0 ]; then
    echo "[✓] ESP32 detected at /dev/ttyUSB0"
    echo ""
    echo "Starting Live Telemetry Stream in Terminal..."
    echo "(Live sensor readings will be printed below and sent to the dashboard)"
    echo "Press Ctrl+C to stop the terminal viewer (backend & frontend will keep running)."
    echo "=================================================="
    echo ""
    cd "$PROJECT_ROOT"
    exec "$PROJECT_ROOT/venv/bin/python" -u "$PROJECT_ROOT/scripts/telemetry_gateway.py"
else
    echo "[!] No ESP32 detected on /dev/ttyUSB0."
    echo "    Plug in the ESP32 USB cable, then run: ./scripts/live_sensors.sh"
    echo ""
    echo "SoilSense Dashboard is open at: http://localhost:3000"
fi
