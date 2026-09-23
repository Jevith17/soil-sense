from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reading import Reading
from app.schemas.balances import WaterBalanceResponse, NitrogenBalanceResponse
from app.engines.process_state import ProcessStateEngine

router = APIRouter(prefix="/balance", tags=["Mass Balances"])

@router.get("/water", response_model=WaterBalanceResponse)
def get_water_balance(
    water_supplied_l: float = Query(12.5, description="Recent water supplied in liters"),
    db: Session = Depends(get_db)
):
    latest = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest:
        # Graceful fallback to benchmark demo telemetry
        latest = Reading(
            moisture=27.0, soil_temp=29.0, ph=6.4, n=64.0, p=51.0, k=73.0,
            air_temp=33.0, humidity=65.0, solar=910.0, ch4=18.0, co2=620.0
        )
    return ProcessStateEngine.calculate_water_balance(latest, water_supplied_l)

@router.get("/nitrogen", response_model=NitrogenBalanceResponse)
def get_nitrogen_balance(
    n_input_g: float = Query(100.0, description="Recent Nitrogen fertilizer input in grams"),
    db: Session = Depends(get_db)
):
    latest = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest:
        latest = Reading(
            moisture=27.0, soil_temp=29.0, ph=6.4, n=64.0, p=51.0, k=73.0,
            air_temp=33.0, humidity=65.0, solar=910.0, ch4=18.0, co2=620.0
        )
    return ProcessStateEngine.calculate_nitrogen_balance(latest, n_input_g)

