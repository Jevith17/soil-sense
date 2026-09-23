from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.decision import Decision
from app.schemas.decision import DecisionResponse
from app.api.data import parse_decision_to_response

router = APIRouter(tags=["Decisions"])

@router.get("/decision", response_model=DecisionResponse)
def get_active_decision(db: Session = Depends(get_db)):
    decision = db.query(Decision).order_by(Decision.id.desc()).first()
    if not decision:
        raise HTTPException(status_code=404, detail="No AI decision generated yet")
    return parse_decision_to_response(decision)

