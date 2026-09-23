from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExperimentCreate(BaseModel):
    crop: Optional[str] = "Precision Tomato (Greenhouse)"
    decision_id: Optional[int] = None
    action_id: Optional[int] = None
    initial_moisture: float
    ai_decision: str
    pump_on_time: Optional[datetime] = None
    pump_off_time: Optional[datetime] = None
    final_moisture: Optional[float] = None
    water_used_liters: float = 0.0
    predicted_result: float
    actual_result: Optional[float] = None
    percentage_error: Optional[float] = None
    notes: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: int
    experiment_code: str
    timestamp: datetime
    crop: str
    decision_id: Optional[int] = None
    action_id: Optional[int] = None
    initial_moisture: float
    ai_decision: str
    pump_on_time: Optional[datetime] = None
    pump_off_time: Optional[datetime] = None
    final_moisture: Optional[float] = None
    water_used_liters: float
    predicted_result: float
    actual_result: Optional[float] = None
    percentage_error: Optional[float] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

