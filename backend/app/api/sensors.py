from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reading import Reading
from app.schemas.reading import SensorHealthSummary
from app.engines.sensor_health import SensorHealthEngine

router = APIRouter(tags=["Sensors"])

@router.get("/sensors/health", response_model=SensorHealthSummary)
def get_sensor_health(db: Session = Depends(get_db)):
    latest = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No telemetry available to assess sensor health.")
    
    recent_readings = db.query(Reading).filter(Reading.id != latest.id).order_by(Reading.id.desc()).limit(10).all()
    return SensorHealthEngine.evaluate(latest, recent_readings)

