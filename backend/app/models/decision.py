from sqlalchemy import Column, Integer, Float, String, Text, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database import Base

class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    reading_id = Column(Integer, ForeignKey("readings.id"), nullable=True)
    
    # Core decision states: IRRIGATE, FERTIGATE, DO NOTHING, WAIT / MONITOR, VERIFY
    decision = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)           # 0.0 to 1.0
    confidence_level = Column(String(20), nullable=False) # HIGH / MEDIUM / LOW
    
    # Transparent reasoning
    why_reasons = Column(Text, nullable=False)           # JSON array of reasons
    top_features = Column(Text, nullable=True)           # JSON dict of feature importances
    
    # Action specifications
    action_type = Column(String(50), default="NONE")     # IRRIGATE / FERTIGATE / NONE
    volume_liters = Column(Float, default=0.0)
    duration_minutes = Column(Integer, default=0)
    when_execute = Column(String(100), default="IMMEDIATE")
    monitoring_interval_minutes = Column(Integer, default=5)
    target_moisture = Column(Float, default=50.0)
    expected_next_state = Column(String(255), default="Optimal soil moisture and nutrient equilibrium")
    
    # Process intelligence states
    water_state = Column(String(20), default="OK")
    nutrient_state = Column(String(20), default="ADEQUATE")
    temp_state = Column(String(20), default="NORMAL")
    env_demand = Column(String(20), default="NORMAL")
    ghg_state = Column(String(20), default="NORMAL")
    sensor_health_state = Column(String(20), default="NORMAL")
    
    # Human-in-the-loop lifecycle
    status = Column(String(30), default="PENDING")       # PENDING / APPROVED / REJECTED / EXECUTED / AUTOMATED
