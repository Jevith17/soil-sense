from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.experiment import Experiment
from app.models.decision import Decision
from app.models.action import Action
from app.models.reading import Reading
from app.schemas.experiment import ExperimentCreate, ExperimentResponse
from app.engines.feedback_engine import FeedbackEngine

router = APIRouter(tags=["Experiments"])

@router.get("/experiments", response_model=List[ExperimentResponse])
def get_all_experiments(db: Session = Depends(get_db)):
    experiments = db.query(Experiment).order_by(Experiment.id.desc()).all()
    return experiments

@router.post("/experiments", response_model=ExperimentResponse)
def create_experiment(payload: ExperimentCreate, db: Session = Depends(get_db)):
    code = f"EXP-{datetime.now().strftime('%Y%m')}-{db.query(Experiment).count() + 1:03d}"
    
    pct_err = payload.percentage_error
    if pct_err is None and payload.actual_result is not None and payload.predicted_result > 0:
        pct_err = round(abs(payload.actual_result - payload.predicted_result) / payload.predicted_result * 100.0, 2)

    exp = Experiment(
        experiment_code=code,
        crop=payload.crop or "Precision Tomato (Greenhouse)",
        decision_id=payload.decision_id,
        action_id=payload.action_id,
        initial_moisture=payload.initial_moisture,
        ai_decision=payload.ai_decision,
        pump_on_time=payload.pump_on_time or datetime.now(timezone.utc),
        pump_off_time=payload.pump_off_time or datetime.now(timezone.utc),
        final_moisture=payload.final_moisture,
        water_used_liters=payload.water_used_liters,
        predicted_result=payload.predicted_result,
        actual_result=payload.actual_result,
        percentage_error=pct_err,
        notes=payload.notes or "Manual experiment submission"
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

@router.post("/experiments/record-cycle", response_model=ExperimentResponse)
def record_cycle_feedback(
    decision_id: Optional[int] = None,
    action_id: Optional[int] = None,
    final_moisture_reading_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Closes the feedback loop: Takes an approved action and a subsequent telemetry reading,
    evaluating predicted vs actual response.
    """
    decision = db.query(Decision).filter(Decision.id == decision_id).first() if decision_id else db.query(Decision).order_by(Decision.id.desc()).first()
    action = db.query(Action).filter(Action.id == action_id).first() if action_id else db.query(Action).order_by(Action.id.desc()).first()
    
    if not decision or not action:
        raise HTTPException(status_code=400, detail="Cannot record feedback cycle: Decision or Action not found.")

    initial_reading = db.query(Reading).filter(Reading.id == decision.reading_id).first() if decision.reading_id else db.query(Reading).order_by(Reading.id.asc()).first()
    final_reading = db.query(Reading).filter(Reading.id == final_moisture_reading_id).first() if final_moisture_reading_id else db.query(Reading).order_by(Reading.id.desc()).first()

    if not initial_reading or not final_reading:
        raise HTTPException(status_code=400, detail="Telemetry readings missing for experiment evaluation.")

    exp = FeedbackEngine.record_experiment(
        decision=decision,
        action=action,
        initial_reading=initial_reading,
        final_reading=final_reading
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp

