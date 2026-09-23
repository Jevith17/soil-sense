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

@router.post("/data", response_model=ReadingResponse)
def ingest_data(
    payload: ReadingCreate, 
    db: Session = Depends(get_db),
    x_device_id: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    # Optional device authentication check
    device_id = x_device_id or payload.device_id or "SIMULATOR"
    data_source = payload.data_source or ("REAL" if x_device_id else "SIMULATED")

    # 1. Create and persist Reading
    reading = Reading(
        timestamp=payload.timestamp or datetime.now(timezone.utc),
        moisture=payload.moisture,
        soil_temp=payload.soil_temp,
        ph=payload.ph,
        n=payload.n,
        p=payload.p,
        k=payload.k,
        air_temp=payload.air_temp,
        humidity=payload.humidity,
        solar=payload.solar,
        ch4=payload.ch4,
        co2=payload.co2,
        pump_status=payload.pump_status or "OFF",
        data_source=data_source,
        device_id=device_id,
        analog_moisture_raw=payload.analog_moisture_raw,
        digital_moisture_raw=payload.digital_moisture_raw
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)

    # 2. Retrieve recent history for anomaly detection (jump, flatlining)
    recent_readings = db.query(Reading).filter(Reading.id != reading.id).order_by(Reading.id.desc()).limit(10).all()

    # 3. Sensor Health Engine
    health_summary = SensorHealthEngine.evaluate(reading, recent_readings)

    # 4. Chemical Engineering Process State Engine
    process_state = ProcessStateEngine.evaluate(reading)

    # 5. Decision Engine (Random Forest + Process Rules + Sensor Health Override)
    decision = DecisionEngine.evaluate(reading, health_summary, process_state)
    decision.reading_id = reading.id
    
    db.add(decision)
    db.commit()
    db.refresh(decision)

    return reading

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

