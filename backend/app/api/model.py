from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.experiment import Experiment
from app.ml.trainer import MLTrainer

router = APIRouter(prefix="/model", tags=["Machine Learning"])

@router.get("/status")
def get_model_status():
    return MLTrainer.get_status()

@router.post("/train")
def retrain_model(db: Session = Depends(get_db)):
    """
    Retrains the Random Forest classifier on base dataset + closed-loop experiments.
    Never silently retrains; explicitly reports new metrics.
    """
    experiments = db.query(Experiment).all()
    exp_logs = [
        {
            "initial_moisture": e.initial_moisture,
            "final_moisture": e.final_moisture,
            "ai_decision": e.ai_decision
        }
        for e in experiments
    ]
    
    updated_meta = MLTrainer.retrain(exp_logs)
    return {
        "status": "success",
        "message": "Random Forest model successfully retrained on production data.",
        "model_metadata": updated_meta
    }

