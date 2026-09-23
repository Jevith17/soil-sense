from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReadingBase(BaseModel):
    moisture: float = Field(..., description="Soil moisture percentage (0-100)")
    soil_temp: float = Field(..., description="Soil temperature in °C")
    ph: float = Field(..., description="Soil pH level (0-14)")
    n: float = Field(..., description="Nitrogen mg/kg")
    p: float = Field(..., description="Phosphorus mg/kg")
    k: float = Field(..., description="Potassium mg/kg")
    air_temp: float = Field(..., description="Air temperature in °C")
    humidity: float = Field(..., description="Relative humidity %")
    solar: float = Field(..., description="Solar irradiance W/m²")
    ch4: float = Field(..., description="Methane in ppm")
    co2: float = Field(..., description="Carbon dioxide in ppm")
    pump_status: Optional[str] = "OFF"
    data_source: Optional[str] = "SIMULATED" # "REAL" or "SIMULATED"
    device_id: Optional[str] = "ESP32-AGRI-01"
    analog_moisture_raw: Optional[int] = None
    digital_moisture_raw: Optional[int] = None

class ReadingCreate(ReadingBase):
    timestamp: Optional[datetime] = None

class ReadingResponse(ReadingBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class SensorCheckDetail(BaseModel):
    name: str
    value: Any
    unit: str
    status: str # NORMAL, CHECK, FAULT
    checks: Dict[str, bool] # {"range": True, "jump": True, "flatline": True, "drift": True, "cross_sensor": True}
    message: str

class SensorHealthSummary(BaseModel):
    overall_status: str # NORMAL, CHECK, FAULT
    requires_verify: bool
    timestamp: datetime
    sensors: Dict[str, SensorCheckDetail]

