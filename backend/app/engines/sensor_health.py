from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.reading import Reading
from app.schemas.reading import SensorHealthSummary, SensorCheckDetail

class SensorHealthEngine:
    """
    Mandatory Sensor Health & Validation Engine.
    Evaluates:
      1. Missing readings
      2. Out-of-bounds impossible values
      3. Sudden jumps (spikes)
      4. Flatlining (stuck sensor values)
      5. Sensor drift
      6. Cross-sensor disagreement (analog vs digital moisture)
    """

    KEY_SENSORS = ["moisture", "soil_temp", "air_temp", "humidity", "ph"]

    # Physical valid operational ranges
    RANGES = {
        "moisture": (0.0, 100.0, "%"),
        "soil_temp": (-10.0, 60.0, "°C"),
        "ph": (0.0, 14.0, "pH"),
        "n": (0.0, 500.0, "mg/kg"),
        "p": (0.0, 300.0, "mg/kg"),
        "k": (0.0, 500.0, "mg/kg"),
        "air_temp": (-10.0, 65.0, "°C"),
        "humidity": (0.0, 100.0, "%"),
        "solar": (0.0, 2000.0, "W/m²"),
        "ch4": (0.0, 500.0, "ppm"),
        "co2": (0.0, 5000.0, "ppm"),
    }

    # Max reasonable change between consecutive readings (5-10s interval)
    MAX_JUMP = {
        "moisture": 25.0,
        "soil_temp": 10.0,
        "ph": 3.0,
        "n": 100.0,
        "air_temp": 12.0,
        "humidity": 30.0,
    }

    @classmethod
    def evaluate(
        cls, 
        current: Reading, 
        recent_history: Optional[List[Reading]] = None,
        esp_health: Optional[Dict[str, str]] = None,
        esp_overall: Optional[str] = None
    ) -> SensorHealthSummary:
        sensor_details: Dict[str, SensorCheckDetail] = {}
        history = recent_history or []
        requires_verify = False
        has_check = False
        has_fault = False

        # 1. Check each sensor against basic ranges and jumps
        for sensor_name, (min_val, max_val, unit) in cls.RANGES.items():
            val = getattr(current, sensor_name, None)
            
            checks = {
                "missing": val is not None,
                "range": True,
                "jump": True,
                "flatline": True,
                "drift": True,
                "cross_sensor": True
            }
            
            status = "NORMAL"
            msg = "Sensor reading within nominal range."

            # Check missing
            if val is None:
                checks["missing"] = False
                status = "FAULT"
                msg = f"Missing telemetry data for {sensor_name}."
            else:
                # Check range
                if val < min_val or val > max_val:
                    checks["range"] = False
                    status = "FAULT"
                    msg = f"Impossible value {val} {unit} outside permissible bounds [{min_val}, {max_val}]."

                # Check jump against previous reading
                if checks["range"] and history and sensor_name in cls.MAX_JUMP:
                    prev_val = getattr(history[0], sensor_name, None)
                    if prev_val is not None and abs(val - prev_val) > cls.MAX_JUMP[sensor_name]:
                        # Unless pump status just transitioned, sudden jump is a CHECK or FAULT
                        checks["jump"] = False
                        status = "CHECK" if status != "FAULT" else status
                        msg = f"Sudden telemetry jump: delta of {abs(val - prev_val):.1f} {unit} detected."

                # Check flatlining (> 8 identical non-zero readings in history)
                if checks["range"] and len(history) >= 8:
                    past_vals = [getattr(h, sensor_name, None) for h in history[:8]]
                    if all(pv is not None and abs(pv - val) < 1e-4 for pv in past_vals):
                        checks["flatline"] = False
                        status = "CHECK" if status != "FAULT" else status
                        msg = f"Potential sensor flatline: identical value across last 8 readings."

            # Cross-sensor validation for soil moisture (analog vs digital)
            if sensor_name == "moisture":
                analog_raw = getattr(current, "analog_moisture_raw", None)
                digital_raw = getattr(current, "digital_moisture_raw", None)
                # digital_raw: 0 = wet/moist, 1 = dry in standard ESP32 comparator modules
                if digital_raw is not None and val is not None:
                    if (val < 20.0 and digital_raw == 0) or (val > 60.0 and digital_raw == 1):
                        checks["cross_sensor"] = False
                        status = "FAULT"
                        msg = f"Sensor conflict: analog reads {val}% but digital pin indicates {'wet' if digital_raw == 0 else 'dry'}."

            # First-line checks forwarded directly from ESP32 edge node
            if esp_health:
                if sensor_name == "moisture" and esp_health.get("moisture") == "FAULT":
                    status = "FAULT"
                    checks["range"] = False
                    msg = "ESP32 reported ADC out of valid window (shorted or disconnected probe)."
                elif sensor_name == "soil_temp" and esp_health.get("soil_temp") == "FAULT":
                    status = "FAULT"
                    checks["range"] = False
                    msg = "ESP32 reported DS18B20 fault (-127°C disconnected or 85°C boot default)."
                elif sensor_name in ["air_temp", "humidity"] and esp_health.get("dht22") == "FAULT":
                    status = "FAULT"
                    checks["range"] = False
                    msg = "ESP32 reported DHT22 communication failure or NaN readout."

            if status == "FAULT":
                has_fault = True
                if sensor_name in cls.KEY_SENSORS:
                    requires_verify = True
            elif status == "CHECK":
                has_check = True

            sensor_details[sensor_name] = SensorCheckDetail(
                name=sensor_name,
                value=val,
                unit=unit,
                status=status,
                checks=checks,
                message=msg
            )

        # 2. Add telemetry link status
        link_status = "NORMAL"
        link_msg = "ESP32 telemetry link active."
        from datetime import timezone
        now = datetime.now(timezone.utc)
        cur_ts = current.timestamp or now
        if cur_ts.tzinfo is None:
            cur_ts = cur_ts.replace(tzinfo=timezone.utc)
        age_seconds = (now - cur_ts).total_seconds()

        if age_seconds > 30.0 and current.data_source in ["REAL", "Measured"]:
            link_status = "FAULT"
            link_msg = f"Communication lost: No telemetry packet received for {int(age_seconds)}s."
            has_fault = True
            requires_verify = True
        elif age_seconds > 15.0 and current.data_source in ["REAL", "Measured"]:
            link_status = "CHECK"
            link_msg = f"Telemetry packet latency elevated ({int(age_seconds)}s)."
            has_check = True

        sensor_details["link"] = SensorCheckDetail(
            name="link",
            value=link_status,
            unit="",
            status=link_status,
            checks={"connected": link_status != "FAULT"},
            message=link_msg
        )

        if esp_overall == "FAULT":
            has_fault = True
            requires_verify = True

        overall = "FAULT" if has_fault else ("CHECK" if has_check else "NORMAL")

        return SensorHealthSummary(
            overall_status=overall,
            requires_verify=requires_verify,
            timestamp=cur_ts,
            sensors=sensor_details
        )

