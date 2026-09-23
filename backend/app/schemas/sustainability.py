from pydantic import BaseModel
from typing import Dict, Any, List

class SustainabilityMetricsResponse(BaseModel):
    total_water_used_liters: float
    total_water_saved_liters: float
    water_saving_percentage: float
    nutrient_use_efficiency_pct: float
    fertilizer_runoff_prevented_kg: float
    co2_equivalent_mitigated_kg: float
    sustainability_score: float # 0 - 100
    daily_trend: List[Dict[str, Any]]

