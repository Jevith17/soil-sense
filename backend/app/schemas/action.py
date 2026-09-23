from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActionCreate(BaseModel):
    decision_id: Optional[int] = None
    action_type: str # APPROVE, REJECT, MODIFY, AUTOMATE, MANUAL_ON, MANUAL_OFF
    pump_state: Optional[str] = None # "ON" or "OFF"
    duration_minutes: Optional[int] = None
    volume_liters: Optional[float] = None
    reason: Optional[str] = None
    user_name: Optional[str] = "Operator"

class ActionResponse(BaseModel):
    id: int
    timestamp: datetime
    decision_id: Optional[int] = None
    user_name: str
    action_type: str
    pump_state: str
    duration_minutes: int
    volume_liters: float
    reason: Optional[str] = None
    execution_status: str
    is_hardware_dispatched: bool
    executed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CommandPollResponse(BaseModel):
    command_available: bool
    action_id: Optional[int] = None
    command: str # "PUMP_ON", "PUMP_OFF", "NONE"
    duration_seconds: int = 0
    volume_liters: float = 0.0
    authorized_at: Optional[datetime] = None
    safety_code: str = "SAFE"
    dry_run: bool = True

