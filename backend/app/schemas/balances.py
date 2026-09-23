from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class WaterBalanceResponse(BaseModel):
    water_supplied_l: float
    estimated_loss_l: float
    net_water_change_l: float # ΔMw = Win - Wloss
    transpiration_loss_l: float
    evaporation_loss_l: float
    soil_retention_capacity_l: float
    formula: str = "ΔMw = Win - Wloss"
    calculation_details: Dict[str, Any]

class NitrogenBalanceResponse(BaseModel):
    n_input_g: float
    n_utilization_g: float # Plant uptake
    n_loss_g: float        # Leaching + volatilization
    n_remaining_g: float   # ΔN = Ninput - Nutilization - Nloss
    n_leaching_risk: str   # LOW / MODERATE / HIGH
    formula: str = "ΔN = Ninput - Nutilization - Nloss"
    calculation_details: Dict[str, Any]

class ProcessStateResponse(BaseModel):
    water_status: str # LOW / OK / HIGH
    nutrient_status: str # LOW / ADEQUATE / HIGH
    temp_status: str # LOW / NORMAL / HIGH
    env_demand: str # LOW / NORMAL / HIGH
    ghg_status: str # NORMAL / HIGH
    crop_response: str
    water_balance: WaterBalanceResponse
    nitrogen_balance: NitrogenBalanceResponse
    summary: str

