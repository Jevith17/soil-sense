from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.reading import Reading
from app.schemas.balances import ProcessStateResponse
from app.engines.process_state import ProcessStateEngine

router = APIRouter(tags=["Process Intelligence"])

@router.get("/process-state", response_model=ProcessStateResponse)
def get_process_state(db: Session = Depends(get_db)):
    latest = db.query(Reading).order_by(Reading.id.desc()).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No telemetry available to compute process state.")
    return ProcessStateEngine.evaluate(latest)

