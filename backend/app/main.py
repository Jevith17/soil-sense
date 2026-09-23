import os
import json
import logging
from datetime import datetime, timezone, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models.user import User
from app.models.reading import Reading
from app.models.decision import Decision
from app.models.action import Action
from app.models.experiment import Experiment

from app.api.health import router as health_router
from app.api.data import router as data_router
from app.api.decision import router as decision_router
from app.api.command import router as command_router
from app.api.sensors import router as sensors_router
from app.api.process_state import router as process_state_router
from app.api.balance import router as balance_router
from app.api.experiments import router as experiments_router
from app.api.simulation import router as simulation_router
from app.api.model import router as model_router
from app.api.sustainability import router as sustainability_router
from app.api.copilot import router as copilot_router
from app.api.auth import router as auth_router, hash_password

from app.engines.sensor_health import SensorHealthEngine
from app.engines.process_state import ProcessStateEngine
from app.engines.decision_engine import DecisionEngine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("agrichem")

def seed_initial_demo_data():
    db = SessionLocal()
    try:
        # 1. Seed Admin User
        admin = db.query(User).filter(User.email == "admin@agrichem.ai").first()
        if not admin:
            admin = User(
                email="admin@agrichem.ai",
                hashed_password=hash_password("admin123"),
                full_name="Chief Agronomist",
                role="Admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Seeded default admin user: admin@agrichem.ai / admin123")

        # 2. Check if readings exist; if not, seed the exact demo benchmark
        if db.query(Reading).count() == 0:
            logger.info("Initializing database with Build Guide benchmark demo telemetry...")
            demo_time = datetime.now(timezone.utc)
            
            # Seed 2 historical readings leading up to demo point
            hist1 = Reading(
                timestamp=demo_time - timedelta(minutes=15),
                moisture=31.5,
                soil_temp=28.2,
                ph=6.42,
                n=65.0,
                p=52.0,
                k=74.0,
                air_temp=31.5,
                humidity=68.0,
                solar=840.0,
                ch4=17.5,
                co2=615.0,
                pump_status="OFF",
                data_source="SIMULATED",
                device_id="ESP32-AGRI-01",
                analog_moisture_raw=3050,
                digital_moisture_raw=1
            )
            hist2 = Reading(
                timestamp=demo_time - timedelta(minutes=7),
                moisture=29.0,
                soil_temp=28.7,
                ph=6.41,
                n=64.5,
                p=51.5,
                k=73.5,
                air_temp=32.2,
                humidity=66.5,
                solar=880.0,
                ch4=17.8,
                co2=618.0,
                pump_status="OFF",
                data_source="SIMULATED",
                device_id="ESP32-AGRI-01",
                analog_moisture_raw=3200,
                digital_moisture_raw=1
            )
            db.add(hist1)
            db.add(hist2)
            db.commit()

            # Exact demo reading
            demo_reading = Reading(
                timestamp=demo_time,
                moisture=27.0,
                soil_temp=29.0,
                ph=6.4,
                n=64.0,
                p=51.0,
                k=73.0,
                air_temp=33.0,
                humidity=65.0,
                solar=910.0,
                ch4=18.0,
                co2=620.0,
                pump_status="OFF",
                data_source="SIMULATED",
                device_id="ESP32-AGRI-01",
                analog_moisture_raw=3350,
                digital_moisture_raw=1
            )
            db.add(demo_reading)
            db.commit()
            db.refresh(demo_reading)

            # Evaluate through engines
            recent = [hist2, hist1]
            health = SensorHealthEngine.evaluate(demo_reading, recent)
            proc = ProcessStateEngine.evaluate(demo_reading)
            dec = DecisionEngine.evaluate(demo_reading, health, proc)
            dec.reading_id = demo_reading.id

            db.add(dec)
            db.commit()
            db.refresh(dec)

            # Seed a historical experiment to illustrate closed-loop validation
            past_action = Action(
                decision_id=dec.id,
                user_name="Lead Agronomist",
                action_type="APPROVE",
                pump_state="ON",
                duration_minutes=6,
                volume_liters=12.5,
                reason="Routine moisture replenishment cycle",
                execution_status="COMPLETED",
                is_hardware_dispatched=False,
                executed_at=demo_time - timedelta(hours=2)
            )
            db.add(past_action)
            db.commit()
            db.refresh(past_action)

            past_exp = Experiment(
                experiment_code="EXP-2026-001",
                crop="Precision Tomato (Greenhouse)",
                decision_id=dec.id,
                action_id=past_action.id,
                initial_moisture=26.5,
                ai_decision="IRRIGATE",
                pump_on_time=demo_time - timedelta(hours=2),
                pump_off_time=demo_time - timedelta(hours=1, minutes=54),
                final_moisture=49.2,
                water_used_liters=12.5,
                predicted_result=50.0,
                actual_result=49.2,
                percentage_error=1.6,
                notes="Calibration trial run #1: Rapid water infiltration, error well within tolerance (1.6%)."
            )
            db.add(past_exp)
            db.commit()
            logger.info("Database initialized successfully with demo readings and experiment.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created & demo seed
    Base.metadata.create_all(bind=engine)
    seed_initial_demo_data()
    logger.info("AgriChem AI backend service started successfully.")
    yield
    # Shutdown
    logger.info("AgriChem AI backend shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous Process Intelligence & Decision Platform for Sustainable Agriculture",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API routes with /api prefix
api_prefix = "/api"
app.include_router(health_router, prefix=api_prefix)
app.include_router(data_router, prefix=api_prefix)
app.include_router(decision_router, prefix=api_prefix)
app.include_router(command_router, prefix=api_prefix)
app.include_router(sensors_router, prefix=api_prefix)
app.include_router(process_state_router, prefix=api_prefix)
app.include_router(balance_router, prefix=api_prefix)
app.include_router(experiments_router, prefix=api_prefix)
app.include_router(simulation_router, prefix=api_prefix)
app.include_router(model_router, prefix=api_prefix)
app.include_router(sustainability_router, prefix=api_prefix)
app.include_router(copilot_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)

