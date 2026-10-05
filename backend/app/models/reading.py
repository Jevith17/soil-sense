from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime
from datetime import datetime, timezone
from app.database import Base

class Reading(Base):
    __tablename__ = "readings"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Soil Sensors (Tier 3 physical + Tier 1/2 soil baseline)
    moisture = Column(Float, nullable=True)            # % (0 - 100), null on sensor fault
    soil_temp = Column(Float, nullable=True)           # °C, null on sensor fault
    ph = Column(Float, nullable=True, default=6.4)     # pH (Tier 1/2 soil record)
    n = Column(Float, nullable=True, default=64.0)     # mg/kg (Tier 1/2 soil record)
    p = Column(Float, nullable=True, default=51.0)     # mg/kg (Tier 1/2 soil record)
    k = Column(Float, nullable=True, default=73.0)     # mg/kg (Tier 1/2 soil record)
    
    # Environment Sensors (Tier 3 physical + boundary flux)
    air_temp = Column(Float, nullable=True)            # °C, null on sensor fault
    humidity = Column(Float, nullable=True)            # % RH, null on sensor fault
    solar = Column(Float, nullable=True, default=850.0) # W/m² (computed / boundary)
    
    # Emissions Sensors (Tier 1/2 or research baseline)
    ch4 = Column(Float, nullable=True, default=18.0)   # ppm
    co2 = Column(Float, nullable=True, default=600.0)  # ppm
    
    # Physical/Hardware states
    pump_status = Column(String(20), default="OFF")    # ON / OFF
    data_source = Column(String(20), default="SIMULATED") # REAL / SIMULATED / Measured
    device_id = Column(String(50), default="esp32-01")
    uptime_s = Column(Integer, nullable=True)
    firmware_version = Column(String(50), default="1.0.0")
    overall_health = Column(String(20), default="NORMAL")
    
    # Raw hardware pins for calibration & validation
    analog_moisture_raw = Column(Integer, nullable=True) # ADC value e.g. 0-4095
    digital_moisture_raw = Column(Integer, nullable=True) # 0=wet, 1=dry
