from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class DecisionResponse(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    reading_id: Optional[int] = None
    
    # 5 Output states: IRRIGATE, FERTIGATE, DO NOTHING, WAIT / MONITOR, VERIFY
    decision: str
    confidence: float
    confidence_level: str # HIGH, MEDIUM, LOW
    
    # Transparent reasoning
    why_reasons: List[str]
    top_features: Dict[str, float]
    
    # Action breakdown
    action_type: str
    volume_liters: float
    duration_minutes: int
    when_execute: str
    monitoring_interval_minutes: int
    target_moisture: float
    expected_next_state: str
    
    # Process states
    water_state: str # LOW, OK, HIGH
    nutrient_state: str # LOW, ADEQUATE, HIGH
    temp_state: str # LOW, NORMAL, HIGH
    env_demand: str # LOW, NORMAL, HIGH
    ghg_state: str # NORMAL, HIGH
    sensor_health_state: str # NORMAL, CHECK, FAULT
    status: str # PENDING, APPROVED, REJECTED, EXECUTED, AUTOMATED

    class Config:
        from_attributes = True

