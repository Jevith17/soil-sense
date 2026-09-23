import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgriChem AI"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    
    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://127.0.0.1:3000", "*"]
    
    @field_validator("CORS_ORIGINS", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # Database
    DATABASE_URL: str = "sqlite:///./agrichem.db"
    
    # Security
    SECRET_KEY: str = "agrichem-ai-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # ESP32 Auth & Hardware
    ESP32_DEVICE_ID: str = "ESP32-AGRI-01"
    ESP32_API_KEY: str = "esp32-secure-token-agrichem-2026"
    PUMP_HARDWARE_ENABLED: bool = False
    
    # Process limits & safety
    MAX_PUMP_RUNTIME_MINUTES: int = 15
    MIN_GAP_BETWEEN_PUMPS_MINUTES: int = 10
    MOISTURE_UPPER_LIMIT: float = 85.0
    MOISTURE_LOWER_LIMIT: float = 30.0
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.path.join(BASE_DIR, "ml")
    DATA_DIR: str = os.path.join(os.path.dirname(BASE_DIR), "data")

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
