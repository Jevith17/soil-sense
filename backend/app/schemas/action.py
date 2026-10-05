from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActionCreate(BaseModel):
    decision_id: Optional[int] = None
    action_type: str # APPROVE, REJECT, MODIFY, AUTOMATE, MANUAL_ON, MANUAL_OFF
    pump_state: Optional[str] = None # "ON" or "OFF"
    duration_minutes: Optional[int] = None
    duration_s: Optional[float] = None
    volume_liters: Optional[float] = None
    events: Optional[int] = 1
    interval_s: Optional[float] = 0.0
    channel: Optional[int] = 1
    approval_id: Optional[str] = None
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
    approval_id: Optional[str] = None
    channel: Optional[int] = 1
    duration_s: Optional[float] = None
    events: Optional[int] = 1
    interval_s: Optional[float] = 0.0
    actual_on_ms: Optional[int] = None
    event_no: Optional[int] = 1
    ack_status: Optional[str] = None
    ack_reason: Optional[str] = None

    class Config:
        from_attributes = True

class CommandPollResponse(BaseModel):
    # Framework v3 physical fields
    command: str = "NONE" # "PUMP_ON", "PUMP_OFF", "NONE"
    channel: int = 1
    duration_s: float = 0.0
    events: int = 1
    interval_s: float = 0.0
    approval_id: Optional[str] = None
    
    # Backward compatibility with existing frontend and tests
    command_available: bool = False
    action_id: Optional[int] = None
    duration_seconds: int = 0
    volume_liters: float = 0.0
    authorized_at: Optional[datetime] = None
    safety_code: str = "SAFE"
    dry_run: bool = True

class AckPayload(BaseModel):
    device_id: str = "esp32-01"
    approval_id: str
    status: str # EVENT_DONE | COMPLETED | REJECTED | ABORTED_FAULT
    event_no: int = 1
    actual_on_ms: int = 0
    reason: Optional[str] = ""

