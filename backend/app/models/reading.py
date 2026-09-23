from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Soil Sensors
    moisture = Column(Float, nullable=False)           # % (0 - 100)
    soil_temp = Column(Float, nullable=False)          # °C
    ph = Column(Float, nullable=False)                 # pH (0 - 14)
    n = Column(Float, nullable=False)                  # mg/kg (N)
    p = Column(Float, nullable=False)                  # mg/kg (P)
    k = Column(Float, nullable=False)                  # mg/kg (K)
    
    # Environment Sensors
    air_temp = Column(Float, nullable=False)           # °C
    humidity = Column(Float, nullable=False)           # % RH
    solar = Column(Float, nullable=False)              # W/m²
    
    # Emissions Sensors
    ch4 = Column(Float, nullable=False)                # ppm
    co2 = Column(Float, nullable=False)                # ppm
    
    # Physical/Hardware states
    pump_status = Column(String(20), default="OFF")    # ON / OFF
    data_source = Column(String(20), default="SIMULATED") # REAL / SIMULATED
    device_id = Column(String(50), default="SIMULATOR")
    
    # Raw hardware pins for cross-sensor validation
    analog_moisture_raw = Column(Integer, nullable=True) # ADC value e.g. 0-4095
    digital_moisture_raw = Column(Integer, nullable=True) # 0=wet, 1=dry
