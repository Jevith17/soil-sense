from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Boolean
from datetime import datetime, timezone
from app.database import Base

class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(100), default="Operator")
    
    # Action type: APPROVE, REJECT, MODIFY, AUTOMATE, MANUAL_ON, MANUAL_OFF
    action_type = Column(String(50), nullable=False)
    pump_state = Column(String(20), nullable=False)  # ON / OFF
    duration_minutes = Column(Integer, default=0)
    volume_liters = Column(Float, default=0.0)
    reason = Column(String(255), nullable=True)
    
    # Execution status: PENDING, DISPATCHED, EXECUTED, REJECTED, SAFETY_BLOCKED, EVENT_DONE, COMPLETED, ABORTED_FAULT
    execution_status = Column(String(50), default="PENDING")
    is_hardware_dispatched = Column(Boolean, default=False)
    executed_at = Column(DateTime, nullable=True)

    # Hardware execution and acknowledgement tracking (Framework v3)
    approval_id = Column(String(50), nullable=True, index=True)
    channel = Column(Integer, default=1)
    duration_s = Column(Float, default=0.0)
    events = Column(Integer, default=1)
    interval_s = Column(Float, default=0.0)
    actual_on_ms = Column(Integer, nullable=True)
    event_no = Column(Integer, default=1)
    ack_status = Column(String(50), nullable=True)
    ack_reason = Column(String(255), nullable=True)
    device_id = Column(String(50), default="esp32-01")

