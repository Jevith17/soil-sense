from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class SimulationScenarioRequest(BaseModel):
    scenario: str # DRY_SOIL, WET_SOIL, LOW_N, NORMAL, SENSOR_FAILURE, POST_IRRIGATION

class WhatIfRequest(BaseModel):
    moisture: float = Field(..., ge=0.0, le=100.0)
    n: float = Field(..., ge=0.0)
    temperature: float = Field(..., description="Soil/Air temp in °C")
    humidity: float = Field(..., ge=0.0, le=100.0)
    solar: float = Field(..., ge=0.0)
    crop: Optional[str] = "Precision Tomato (Greenhouse)"

class ScenarioOutcome(BaseModel):
    action: str # DO_NOTHING, IRRIGATE, FERTIGATE
    water_impact: str
    nutrient_impact: str
    expected_state: str
    risk_level: str # LOW, MODERATE, HIGH, CRITICAL
    risk_description: str
    estimated_yield_impact: str

class WhatIfResponse(BaseModel):
    input_values: Dict[str, float]
    scenarios: List[ScenarioOutcome]
    recommended_choice: str
    rationale: str

