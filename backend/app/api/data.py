from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone
import json

from app.database import get_db
from app.config import settings
from app.models.reading import Reading
from app.models.decision import Decision
from app.schemas.reading import ReadingCreate, ReadingResponse
from app.schemas.decision import DecisionResponse
from app.engines.sensor_health import SensorHealthEngine
from app.engines.process_state import ProcessStateEngine
from app.engines.decision_engine import DecisionEngine

router = APIRouter(tags=["Data Telemetry"])

def parse_decision_to_response(decision: Decision) -> DecisionResponse:
    why_list = json.loads(decision.why_reasons) if isinstance(decision.why_reasons, str) else decision.why_reasons
    feat_dict = json.loads(decision.top_features) if isinstance(decision.top_features, str) else decision.top_features

    return DecisionResponse(
        id=decision.id,
        timestamp=decision.timestamp,
        reading_id=decision.reading_id,
        decision=decision.decision,
        confidence=decision.confidence,
        confidence_level=decision.confidence_level,
        why_reasons=why_list or [],
        top_features=feat_dict or {},
        action_type=decision.action_type,
        volume_liters=decision.volume_liters,
        duration_minutes=decision.duration_minutes,
        when_execute=decision.when_execute,
        monitoring_interval_minutes=decision.monitoring_interval_minutes,
        target_moisture=decision.target_moisture,
        expected_next_state=decision.expected_next_state,
        water_state=decision.water_state,
        nutrient_state=decision.nutrient_state,
        temp_state=decision.temp_state,
        env_demand=decision.env_demand,
        ghg_state=decision.ghg_state,
        sensor_health_state=decision.sensor_health_state,
        status=decision.status
    )

# Global device status registry for telemetry health
_device_status = {
    "device_id": "esp32-01",
    "online": False,
    "last_seen": None,
    "uptime_s": 0,
    "firmware_version": "1.0.0",
    "overall_health": "NORMAL",
    "pump_status": "OFF",
    "sensor_health": {
        "moisture": "NORMAL",
        "soil_temp": "NORMAL",
        "dht22": "NORMAL"
    }
}

@router.post("/data", response_model=ReadingResponse)
@router.post("/sensor-data", response_model=ReadingResponse)
def ingest_data(
    payload: ReadingCreate, 
    db: Session = Depends(get_db),
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    global _device_status
    device_id = x_device_id or payload.device_id or "esp32-01"
    now_utc = payload.timestamp or datetime.now(timezone.utc)
    if now_utc.tzinfo is None:
        now_utc = now_utc.replace(tzinfo=timezone.utc)

    # Determine data source tag
    if payload.data_source:
        data_source = payload.data_source
    elif x_device_id or (payload.device_id and "esp" in payload.device_id.lower()):
        data_source = "Measured"
    else:
        data_source = "SIMULATED"

    # Normalize pump status (can be boolean or string from ESP32 JSON)
    if isinstance(payload.pump_status, bool):
        pump_status_str = "ON" if payload.pump_status else "OFF"
    elif isinstance(payload.pump_status, str):
        pump_status_str = payload.pump_status.upper()
    else:
        pump_status_str = "OFF"

    raw_adc = payload.moisture_raw if payload.moisture_raw is not None else payload.analog_moisture_raw

    # 1. Create and persist Reading
    reading = Reading(
        timestamp=now_utc,
        moisture=payload.moisture if payload.moisture is not None else 0.0,
        soil_temp=payload.soil_temp if payload.soil_temp is not None else 22.0,
        ph=payload.ph if payload.ph is not None else 6.4,
        n=payload.n if payload.n is not None else 64.0,
        p=payload.p if payload.p is not None else 51.0,
        k=payload.k if payload.k is not None else 73.0,
        air_temp=payload.air_temp if payload.air_temp is not None else 24.0,
        humidity=payload.humidity if payload.humidity is not None else 60.0,
        solar=payload.solar if payload.solar is not None else 850.0,
        ch4=payload.ch4 if payload.ch4 is not None else 18.0,
        co2=payload.co2 if payload.co2 is not None else 600.0,
        pump_status=pump_status_str,
        data_source=data_source,
        device_id=device_id,
        uptime_s=payload.uptime_s,
        firmware_version=payload.firmware_version or "1.0.0",
        overall_health=payload.overall_health or "NORMAL",
        analog_moisture_raw=raw_adc,
        digital_moisture_raw=payload.digital_moisture_raw
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # 2. Retrieve recent history for anomaly detection (jump, flatlining)
    recent_readings = db.query(Reading).filter(Reading.id != reading.id).order_by(Reading.id.desc()).limit(10).all()

    # 3. Sensor Health Engine (incorporates edge-side checks from ESP32)
    health_summary = SensorHealthEngine.evaluate(
        current=reading, 
        recent_history=recent_readings,
        esp_health=payload.sensor_health,
        esp_overall=payload.overall_health
    )

    # Update global device health registry
    _device_status = {
        "device_id": device_id,
        "online": True,
        "last_seen": now_utc.isoformat(),
        "uptime_s": payload.uptime_s or 0,
        "firmware_version": payload.firmware_version or "1.0.0",
        "overall_health": health_summary.overall_status,
        "pump_status": pump_status_str,
        "sensor_health": payload.sensor_health or {
            "moisture": health_summary.sensors.get("moisture", {}).status if hasattr(health_summary.sensors.get("moisture"), "status") else "NORMAL",
            "soil_temp": health_summary.sensors.get("soil_temp", {}).status if hasattr(health_summary.sensors.get("soil_temp"), "status") else "NORMAL",
            "dht22": health_summary.sensors.get("air_temp", {}).status if hasattr(health_summary.sensors.get("air_temp"), "status") else "NORMAL"
        }
    }

    # 4. Chemical Engineering Process State Engine
    process_state = ProcessStateEngine.evaluate(reading)

    # 5. Decision Engine (Random Forest + Process Rules + Sensor Health Override)
    decision = DecisionEngine.evaluate(reading, health_summary, process_state)
    decision.reading_id = reading.id
    
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return reading

@router.get("/device/status")
def get_device_status(db: Session = Depends(get_db)):
    global _device_status
    # Check if last seen was more than 15s ago
    latest_reading = db.query(Reading).filter(Reading.data_source.in_(["REAL", "Measured"])).order_by(Reading.id.desc()).first()
    now_utc = datetime.now(timezone.utc)
    
    if latest_reading and latest_reading.timestamp:
        ts = latest_reading.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        diff = (now_utc - ts).total_seconds()
        is_online = diff < 15.0
        return {
            "device_id": latest_reading.device_id or _device_status.get("device_id", "esp32-01"),
            "online": is_online,
            "last_seen": ts.isoformat(),
            "latency_seconds": round(diff, 1),
            "uptime_s": latest_reading.uptime_s or _device_status.get("uptime_s", 0),
            "firmware_version": latest_reading.firmware_version or "1.0.0",
            "overall_health": latest_reading.overall_health or "NORMAL",
            "pump_status": latest_reading.pump_status or "OFF",
            "data_source": latest_reading.data_source
        }
    
    return _device_status

@router.get("/latest")
def get_latest_telemetry(db: Session = Depends(get_db)):
    reading = db.query(Reading).order_by(Reading.id.desc()).first()
    if not reading:
        raise HTTPException(status_code=404, detail="No telemetry readings recorded yet")
    
    decision = db.query(Decision).filter(Decision.reading_id == reading.id).first()
    if not decision:
        decision = db.query(Decision).order_by(Decision.id.desc()).first()

    return {
        "reading": reading,
        "decision": parse_decision_to_response(decision) if decision else None
    }

@router.get("/history", response_model=List[ReadingResponse])
def get_reading_history(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    readings = db.query(Reading).order_by(Reading.id.desc()).limit(limit).all()
    return list(reversed(readings))

