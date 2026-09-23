from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from datetime import datetime, timezone
from app.database import Base

class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. EXP-2026-001
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    crop = Column(String(100), default="Precision Tomato (Greenhouse)")
    
    decision_id = Column(Integer, ForeignKey("decisions.id"), nullable=True)
    action_id = Column(Integer, ForeignKey("actions.id"), nullable=True)
    
    initial_moisture = Column(Float, nullable=False)
    ai_decision = Column(String(50), nullable=False)
    pump_on_time = Column(DateTime, nullable=True)
    pump_off_time = Column(DateTime, nullable=True)
    final_moisture = Column(Float, nullable=True)
    water_used_liters = Column(Float, default=0.0)
    
    # Model predictions vs actual result
    predicted_result = Column(Float, nullable=False) # e.g. target 50%
    actual_result = Column(Float, nullable=True)    # e.g. measured 48.5%
    percentage_error = Column(Float, nullable=True) # abs(actual - predicted)/predicted * 100
    
    notes = Column(Text, nullable=True)

