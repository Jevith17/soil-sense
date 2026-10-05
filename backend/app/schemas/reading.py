from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReadingBase(BaseModel):
    moisture: Optional[float] = Field(None, description="Soil moisture percentage (0-100), null on sensor fault")
    soil_temp: Optional[float] = Field(None, description="Soil temperature in °C, null on sensor fault")
    air_temp: Optional[float] = Field(None, description="Air temperature in °C, null on sensor fault")
    humidity: Optional[float] = Field(None, description="Relative humidity %, null on sensor fault")
    
    # Tier 1/2 soil baseline & boundary conditions (can be omitted by physical ESP32)
    ph: Optional[float] = Field(6.4, description="Soil pH level (0-14)")
    n: Optional[float] = Field(64.0, description="Nitrogen mg/kg")
    p: Optional[float] = Field(51.0, description="Phosphorus mg/kg")
    k: Optional[float] = Field(73.0, description="Potassium mg/kg")
    solar: Optional[float] = Field(850.0, description="Solar irradiance W/m²")
    ch4: Optional[float] = Field(18.0, description="Methane in ppm")
    co2: Optional[float] = Field(600.0, description="Carbon dioxide in ppm")
    
    pump_status: Optional[Any] = "OFF" # bool or str ("OFF", "ON", False, True)
    data_source: Optional[str] = "SIMULATED" # "REAL" or "SIMULATED" or "Measured"
    device_id: Optional[str] = "esp32-01"
    uptime_s: Optional[int] = None
    analog_moisture_raw: Optional[int] = None
    moisture_raw: Optional[int] = None # Alias for analog_moisture_raw per Framework v3
    digital_moisture_raw: Optional[int] = None
    sensor_health: Optional[Dict[str, str]] = None
    overall_health: Optional[str] = "NORMAL"
    firmware_version: Optional[str] = "1.0.0"

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

