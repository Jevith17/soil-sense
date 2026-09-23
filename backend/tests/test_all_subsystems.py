import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import settings
from app.models.reading import Reading
from app.models.decision import Decision
from app.models.action import Action
from app.models.experiment import Experiment
from app.engines.sensor_health import SensorHealthEngine
from app.engines.process_state import ProcessStateEngine
from app.engines.decision_engine import DecisionEngine
from app.engines.safety_engine import SafetyEngine
from app.engines.feedback_engine import FeedbackEngine

# Use in-memory SQLite for pristine test isolation
SQLALCHEMY_TEST_URL = "sqlite:///:memory:"
test_engine = create_engine(SQLALCHEMY_TEST_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db_session():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

# -------------------------------------------------------------
# TEST 1: Dry soil -> IRRIGATE
# -------------------------------------------------------------
def test_1_dry_soil_triggers_irrigate():
    dry_reading = Reading(
        moisture=24.0, soil_temp=29.0, ph=6.4, n=64.0, p=51.0, k=73.0,
        air_temp=33.0, humidity=65.0, solar=910.0, ch4=18.0, co2=620.0,
        pump_status="OFF", data_source="SIMULATED",
        analog_moisture_raw=3400, digital_moisture_raw=1
    )
    health = SensorHealthEngine.evaluate(dry_reading)
    assert health.overall_status == "NORMAL"
    assert not health.requires_verify

    proc = ProcessStateEngine.evaluate(dry_reading)
    assert proc.water_status == "LOW"

    decision = DecisionEngine.evaluate(dry_reading, health, proc)
    assert decision.decision == "IRRIGATE"
    assert decision.action_type == "IRRIGATE"
    assert decision.duration_minutes > 0
    assert decision.volume_liters > 0

# -------------------------------------------------------------
# TEST 2: Wet soil -> DO NOTHING
# -------------------------------------------------------------
def test_2_wet_soil_triggers_do_nothing():
    wet_reading = Reading(
        moisture=62.0, soil_temp=23.0, ph=6.5, n=75.0, p=50.0, k=75.0,
        air_temp=24.0, humidity=75.0, solar=400.0, ch4=18.0, co2=550.0,
        pump_status="OFF", data_source="SIMULATED",
        analog_moisture_raw=1400, digital_moisture_raw=0
    )
    health = SensorHealthEngine.evaluate(wet_reading)
    proc = ProcessStateEngine.evaluate(wet_reading)
    decision = DecisionEngine.evaluate(wet_reading, health, proc)
    assert decision.decision == "DO NOTHING"
    assert decision.duration_minutes == 0

# -------------------------------------------------------------
# TEST 3: Low N + suitable moisture + suitable environment -> FERTIGATE
# -------------------------------------------------------------
def test_3_low_n_triggers_fertigate():
    low_n_reading = Reading(
        moisture=46.0, soil_temp=24.0, ph=6.4, n=28.0, p=45.0, k=60.0, # N < 50
        air_temp=26.0, humidity=60.0, solar=650.0, ch4=16.0, co2=580.0,
        pump_status="OFF", data_source="SIMULATED",
        analog_moisture_raw=2100, digital_moisture_raw=0
    )
    health = SensorHealthEngine.evaluate(low_n_reading)
    proc = ProcessStateEngine.evaluate(low_n_reading)
    decision = DecisionEngine.evaluate(low_n_reading, health, proc)
    assert decision.decision == "FERTIGATE"
    assert decision.action_type == "FERTIGATE"
    assert decision.duration_minutes > 0

# -------------------------------------------------------------
# TEST 4: Sensor failure -> VERIFY
# -------------------------------------------------------------
def test_4_sensor_failure_triggers_verify():
    # Impossible moisture value > 100%
    faulty_reading = Reading(
        moisture=135.0, soil_temp=25.0, ph=6.4, n=60.0, p=45.0, k=65.0,
        air_temp=28.0, humidity=60.0, solar=700.0, ch4=16.0, co2=550.0,
        pump_status="OFF", data_source="SIMULATED"
    )
    health = SensorHealthEngine.evaluate(faulty_reading)
    assert health.overall_status == "FAULT"
    assert health.requires_verify is True

    proc = ProcessStateEngine.evaluate(faulty_reading)
    decision = DecisionEngine.evaluate(faulty_reading, health, proc)
    assert decision.decision == "VERIFY"
    assert decision.duration_minutes == 0
    assert decision.volume_liters == 0.0

# -------------------------------------------------------------
# TEST 5: Rejected action -> pump remains OFF
# -------------------------------------------------------------
def test_5_rejected_action_leaves_pump_off(client):
    # Ingest dry reading to generate decision
    ingest_res = client.post("/api/data", json={
        "moisture": 25.0, "soil_temp": 28.0, "ph": 6.4, "n": 60.0, "p": 50.0, "k": 70.0,
        "air_temp": 32.0, "humidity": 60.0, "solar": 850.0, "ch4": 17.0, "co2": 600.0
    })
    assert ingest_res.status_code == 200

    # Reject recommendation
    reject_res = client.post("/api/command", json={
        "action_type": "REJECT",
        "reason": "Rain expected soon"
    })
    assert reject_res.status_code == 200
    action = reject_res.json()
    assert action["pump_state"] == "OFF"
    assert action["execution_status"] == "REJECTED"

    # Verify pending command endpoint reports no command available
    poll_res = client.get("/api/command")
    assert poll_res.status_code == 200
    assert poll_res.json()["command_available"] is False

# -------------------------------------------------------------
# TEST 6: Moisture above upper limit -> no irrigation
# -------------------------------------------------------------
def test_6_moisture_above_upper_limit_blocked_by_safety():
    high_reading = Reading(
        moisture=88.0, soil_temp=24.0, ph=6.5, n=70.0, p=50.0, k=70.0,
        air_temp=25.0, humidity=70.0, solar=500.0, ch4=18.0, co2=550.0,
        pump_status="OFF", data_source="SIMULATED"
    )
    health = SensorHealthEngine.evaluate(high_reading)
    decision = Decision(
        decision="IRRIGATE", confidence=0.8, confidence_level="HIGH",
        duration_minutes=5, status="PENDING"
    )
    is_safe, code, reasons = SafetyEngine.validate_action(decision, high_reading, health)
    assert is_safe is False
    assert code == "MOISTURE_UPPER_LIMIT_EXCEEDED"

# -------------------------------------------------------------
# TEST 7: Safety runtime limit
# -------------------------------------------------------------
def test_7_safety_max_runtime_limit():
    reading = Reading(
        moisture=28.0, soil_temp=27.0, ph=6.4, n=60.0, p=50.0, k=70.0,
        air_temp=30.0, humidity=60.0, solar=800.0, ch4=17.0, co2=600.0,
        pump_status="OFF", data_source="SIMULATED"
    )
    health = SensorHealthEngine.evaluate(reading)
    decision = Decision(decision="IRRIGATE", confidence=0.9, duration_minutes=6, status="PENDING")
    
    # Request 30 minutes (exceeds max of 15)
    is_safe, code, reasons = SafetyEngine.validate_action(
        decision, reading, health, requested_duration_min=30
    )
    assert is_safe is False
    assert code == "MAX_RUNTIME_EXCEEDED"

# -------------------------------------------------------------
# TEST 8: Minimum gap between pump runs
# -------------------------------------------------------------
def test_8_minimum_gap_between_runs():
    reading = Reading(
        moisture=26.0, soil_temp=28.0, ph=6.4, n=60.0, p=50.0, k=70.0,
        air_temp=30.0, humidity=60.0, solar=800.0, ch4=17.0, co2=600.0,
        pump_status="OFF", data_source="SIMULATED"
    )
    health = SensorHealthEngine.evaluate(reading)
    decision = Decision(decision="IRRIGATE", confidence=0.9, duration_minutes=5, status="PENDING")

    # Simulate pump ran only 2 minutes ago
    recent_action = Action(
        pump_state="ON",
        execution_status="EXECUTED",
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=2)
    )
    is_safe, code, reasons = SafetyEngine.validate_action(
        decision, reading, health, recent_actions=[recent_action], requested_duration_min=5
    )
    assert is_safe is False
    assert code == "MIN_GAP_VIOLATION"

# -------------------------------------------------------------
# TEST 9: ESP32 command generation & polling
# -------------------------------------------------------------
def test_9_esp32_command_generation_and_polling(client):
    # Ingest dry reading
    client.post("/api/data", json={
        "moisture": 26.0, "soil_temp": 28.0, "ph": 6.4, "n": 60.0, "p": 50.0, "k": 70.0,
        "air_temp": 32.0, "humidity": 60.0, "solar": 850.0, "ch4": 17.0, "co2=600": 600.0, "co2": 600.0
    })

    # Approve action
    app_res = client.post("/api/command", json={
        "action_type": "APPROVE",
        "duration_minutes": 6,
        "volume_liters": 12.5
    })
    assert app_res.status_code == 200

    # Poll command as ESP32
    poll_res = client.get("/api/command", headers={"X-Device-Id": "ESP32-AGRI-01"})
    assert poll_res.status_code == 200
    cmd_data = poll_res.json()
    assert cmd_data["command_available"] is True
    assert cmd_data["command"] == "PUMP_ON"
    assert cmd_data["duration_seconds"] == 360

# -------------------------------------------------------------
# TEST 10: Experiment feedback & error calculation
# -------------------------------------------------------------
def test_10_experiment_feedback_calculation():
    initial = Reading(moisture=26.0)
    final = Reading(moisture=49.0, timestamp=datetime.now(timezone.utc))
    decision = Decision(id=1, decision="IRRIGATE", target_moisture=50.0)
    action = Action(id=1, action_type="APPROVE", duration_minutes=6, volume_liters=12.5)

    exp = FeedbackEngine.record_experiment(decision, action, initial, final)
    assert exp.predicted_result == 50.0
    assert exp.actual_result == 49.0
    assert exp.percentage_error == 2.0  # abs(49-50)/50 * 100 = 2%

# -------------------------------------------------------------
# TEST 11: What-If simulation
# -------------------------------------------------------------
def test_11_what_if_simulation(client):
    res = client.post("/api/simulation/what-if", json={
        "moisture": 22.0,
        "n": 65.0,
        "temperature": 32.0,
        "humidity": 60.0,
        "solar": 850.0
    })
    assert res.status_code == 200
    data = res.json()
    assert data["recommended_choice"] == "IRRIGATE"
    assert len(data["scenarios"]) == 3

# -------------------------------------------------------------
# TEST 12: Model prediction and status endpoint
# -------------------------------------------------------------
def test_12_model_status_and_train_endpoint(client):
    status_res = client.get("/api/model/status")
    assert status_res.status_code == 200
    assert status_res.json()["accuracy"] > 0.90

# -------------------------------------------------------------
# TEST 13: Sensor validation checks (cross-sensor & flatline)
# -------------------------------------------------------------
def test_13_cross_sensor_disagreement():
    # Analog reads dry (15%), but digital pin reads wet (0)
    conflicted_reading = Reading(
        moisture=15.0, soil_temp=25.0, ph=6.4, n=60.0, p=45.0, k=65.0,
        air_temp=26.0, humidity=60.0, solar=600.0, ch4=16.0, co2=550.0,
        analog_moisture_raw=3800, digital_moisture_raw=0 # 0=wet
    )
    health = SensorHealthEngine.evaluate(conflicted_reading)
    moisture_check = health.sensors["moisture"]
    assert moisture_check.checks["cross_sensor"] is False
    assert moisture_check.status == "FAULT"
    assert health.requires_verify is True

# -------------------------------------------------------------
# TEST 14: Water balance
# -------------------------------------------------------------
def test_14_water_balance(client):
    res = client.get("/api/balance/water?water_supplied_l=12.5")
    assert res.status_code == 200
    data = res.json()
    assert "net_water_change_l" in data
    assert data["net_water_change_l"] == round(data["water_supplied_l"] - data["estimated_loss_l"], 1)

# -------------------------------------------------------------
# TEST 15: Nitrogen balance
# -------------------------------------------------------------
def test_15_nitrogen_balance(client):
    res = client.get("/api/balance/nitrogen?n_input_g=100.0")
    assert res.status_code == 200
    data = res.json()
    assert "n_remaining_g" in data
    assert data["n_remaining_g"] == round(data["n_input_g"] - data["n_utilization_g"] - data["n_loss_g"], 1)

# -------------------------------------------------------------
# TEST 16: Complete Simulated End-to-End Workflow
# -------------------------------------------------------------
def test_16_end_to_end_simulated_workflow(client):
    # 1. Simulator generates and triggers DRY_SOIL scenario
    sim_res = client.post("/api/simulation", json={"scenario": "DRY_SOIL"})
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["decision"]["decision"] == "IRRIGATE"
    dec_id = sim_data["decision"]["id"]

    # 2. Human Operator approves recommendation
    app_res = client.post("/api/command", json={
        "decision_id": dec_id,
        "action_type": "APPROVE",
        "duration_minutes": 6,
        "volume_liters": 12.5,
        "user_name": "Senior Operator"
    })
    assert app_res.status_code == 200
    action_data = app_res.json()
    action_id = action_data["id"]
    assert action_data["pump_state"] == "ON"

    # 3. ESP32 polls and consumes approved command
    poll_res = client.get("/api/command")
    assert poll_res.status_code == 200
    assert poll_res.json()["command"] == "PUMP_ON"

    # 4. Irrigation completes -> Simulator posts POST_IRRIGATION reading
    post_res = client.post("/api/simulation", json={"scenario": "POST_IRRIGATION"})
    assert post_res.status_code == 200
    final_reading_id = post_res.json()["reading"]["id"]

    # 5. Closed-loop feedback recorded as experiment
    exp_res = client.post(
        f"/api/experiments/record-cycle?decision_id={dec_id}&action_id={action_id}&final_moisture_reading_id={final_reading_id}"
    )
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["ai_decision"] == "IRRIGATE"
    assert exp_data["percentage_error"] is not None
    assert exp_data["percentage_error"] < 10.0

