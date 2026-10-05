import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models.reading import Reading
from app.models.decision import Decision
from app.models.action import Action
from app.models.experiment import Experiment

# Test DB Setup
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
# TEST T1: Dry Soil -> IRRIGATE -> Human Approval -> ESP32 Polling -> Hardware Ack -> Feedback
# -------------------------------------------------------------
def test_t1_dry_soil_to_ack_pipeline(client):
    # 1. Physical sensor telemetry posted from ESP32
    post_res = client.post("/api/sensor-data", json={
        "device_id": "esp32-01",
        "uptime_s": 120,
        "firmware_version": "1.0.0",
        "moisture": 22.5,
        "moisture_raw": 3480,
        "soil_temp": 28.4,
        "air_temp": 31.2,
        "humidity": 58.0,
        "sensor_health": {
            "moisture": "NORMAL",
            "soil_temp": "NORMAL",
            "air_temp": "NORMAL",
            "humidity": "NORMAL"
        },
        "overall_health": "NORMAL",
        "data_source": "REAL"
    })
    assert post_res.status_code == 200
    telemetry = post_res.json()
    assert telemetry["data_source"] == "REAL"
    assert telemetry["moisture"] == 22.5

    # 2. Check Decision Engine generated IRRIGATE recommendation
    dec_res = client.get("/api/decision")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "IRRIGATE"
    dec_id = decision["id"]

    # 3. Operator approves the recommendation
    approve_res = client.post("/api/command", json={
        "decision_id": dec_id,
        "action_type": "APPROVE",
        "channel": 1,
        "duration_s": 25.0,
        "events": 1,
        "interval_s": 0.0,
        "user_name": "Shift Lead"
    })
    assert approve_res.status_code == 200
    action = approve_res.json()
    assert action["execution_status"] == "DISPATCHED"
    assert action["is_hardware_dispatched"] is True
    approval_id = action.get("approval_id")
    assert approval_id is not None
    assert approval_id.startswith("A-")

    # 4. ESP32 polls GET /api/command
    poll_res = client.get("/api/command", headers={"X-Device-Id": "esp32-01"})
    assert poll_res.status_code == 200
    cmd_data = poll_res.json()
    assert cmd_data["command_available"] is True
    assert cmd_data["command"] == "PUMP_ON"
    assert cmd_data["approval_id"] == approval_id
    assert cmd_data["duration_s"] == 25.0
    assert cmd_data["channel"] == 1

    # Next poll receives NONE (consumed queue)
    empty_poll = client.get("/api/command")
    assert empty_poll.json()["command_available"] is False

    # 5. ESP32 finishes local countdown and posts acknowledgement
    ack_res = client.post("/api/ack", json={
        "approval_id": approval_id,
        "device_id": "esp32-01",
        "event_no": 1,
        "status": "COMPLETED",
        "actual_on_ms": 25040,
        "reason": "Normal timed cycle finished"
    })
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACK_PROCESSED"
    assert ack_res.json()["execution_status"] == "COMPLETED"

    # 6. Verify Experiment closed-loop trial was recorded
    exp_res = client.get("/api/experiments")
    assert exp_res.status_code == 200
    exps = exp_res.json()
    assert len(exps) > 0
    latest_exp = exps[0]
    assert latest_exp["experiment_code"] == f"EXP-{approval_id}"
    assert "actual ON 25040ms" in latest_exp["notes"]

# -------------------------------------------------------------
# TEST T2: Wet Soil -> DO NOTHING -> No Command Dispatched
# -------------------------------------------------------------
def test_t2_wet_soil_do_nothing(client):
    # Wet soil reading (moisture 58%)
    post_res = client.post("/api/sensor-data", json={
        "device_id": "esp32-01",
        "uptime_s": 240,
        "moisture": 58.0,
        "moisture_raw": 1850,
        "soil_temp": 24.5,
        "air_temp": 28.0,
        "humidity": 75.0,
        "data_source": "REAL"
    })
    assert post_res.status_code == 200

    # Decision Engine should recommend DO NOTHING
    dec_res = client.get("/api/decision")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "DO NOTHING"

    # Command poll must return NONE
    poll_res = client.get("/api/command")
    assert poll_res.json()["command_available"] is False
    assert poll_res.json()["command"] == "NONE"

# -------------------------------------------------------------
# TEST T3: Nutrient Deficit -> FERTIGATE Prescription -> Multi-Pulse Command
# -------------------------------------------------------------
def test_t3_fertigate_multi_pulse_command(client):
    # Telemetry with adequate moisture (46%) and low Nitrogen (28 mg/kg)
    client.post("/api/data", json={
        "device_id": "esp32-01",
        "moisture": 46.0,
        "soil_temp": 24.0,
        "ph": 6.4,
        "n": 28.0,
        "p": 45.0,
        "k": 60.0,
        "air_temp": 26.0,
        "humidity": 60.0,
        "solar": 650.0,
        "ch4": 16.0,
        "co2": 580.0,
        "data_source": "REAL"
    })

    dec_res = client.get("/api/decision")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "FERTIGATE"

    # Operator approves with 3 pulse events of 15s each, 30s interval
    approve_res = client.post("/api/command", json={
        "decision_id": decision["id"],
        "action_type": "APPROVE",
        "channel": 1,
        "duration_s": 15.0,
        "events": 3,
        "interval_s": 30.0,
        "user_name": "Agronomist Operator"
    })
    assert approve_res.status_code == 200

    # ESP32 polls command
    poll_res = client.get("/api/command")
    cmd_data = poll_res.json()
    assert cmd_data["command"] == "PUMP_ON"
    assert cmd_data["duration_s"] == 15.0
    assert cmd_data["events"] == 3
    assert cmd_data["interval_s"] == 30.0
    assert cmd_data["approval_id"] is not None

# -------------------------------------------------------------
# TEST T4: Safety Gate Fail -> Action Blocked -> No Command Dispatched
# -------------------------------------------------------------
def test_t4_safety_gate_blocks_hazardous_operation(client):
    # Soil above upper safety limit (moisture 88%)
    client.post("/api/data", json={
        "device_id": "esp32-01",
        "moisture": 88.0,
        "soil_temp": 25.0,
        "air_temp": 29.0,
        "humidity": 80.0
    })

    # Attempt to force manual pump activation
    force_res = client.post("/api/command", json={
        "action_type": "MANUAL_ON",
        "duration_minutes": 10,
        "volume_liters": 20.0
    })
    # Must be rejected with 422 Unprocessable Entity by Safety Interlock
    assert force_res.status_code == 422
    err_body = force_res.json()["detail"]
    assert err_body["code"] == "MOISTURE_UPPER_LIMIT_EXCEEDED"

    # Verify no command exists in queue
    poll_res = client.get("/api/command")
    assert poll_res.json()["command_available"] is False

# -------------------------------------------------------------
# TEST T5: Sensor Fault -> VERIFY Recommendation -> Hardware Disconnect / Abort
# -------------------------------------------------------------
def test_t5_sensor_fault_handling(client):
    # Physical sensor disconnected: ADC out of range (moisture_raw=0 or 4095) & soil_temp is null
    client.post("/api/sensor-data", json={
        "device_id": "esp32-01",
        "uptime_s": 300,
        "moisture": None,
        "moisture_raw": 0,
        "soil_temp": None,
        "air_temp": 32.0,
        "humidity": 55.0,
        "sensor_health": {
            "moisture": "FAULT",
            "soil_temp": "FAULT",
            "air_temp": "NORMAL",
            "humidity": "NORMAL"
        },
        "overall_health": "FAULT"
    })

    # Sensor Health & Decision Engine must flag VERIFY
    dec_res = client.get("/api/decision")
    assert dec_res.status_code == 200
    decision = dec_res.json()
    assert decision["decision"] == "VERIFY"
    assert decision["sensor_health_state"] == "FAULT"

    # Check Device Status endpoint
    dev_res = client.get("/api/device/status")
    assert dev_res.status_code == 200
    dev_status = dev_res.json()
    assert dev_status["device_id"] == "esp32-01"
    assert dev_status["overall_health"] == "FAULT"

# -------------------------------------------------------------
# TEST T6: Command Cancellation by Operator
# -------------------------------------------------------------
def test_t6_command_cancellation(client):
    # Provide dry reading
    client.post("/api/data", json={
        "moisture": 22.0, "soil_temp": 28.0, "ph": 6.4, "n": 60.0, "p": 50.0, "k": 70.0,
        "air_temp": 30.0, "humidity": 60.0
    })

    # Approve action
    app_res = client.post("/api/command", json={
        "action_type": "APPROVE",
        "duration_minutes": 5,
        "volume_liters": 10.0
    })
    assert app_res.status_code == 200

    # Operator cancels before ESP32 polls
    cancel_res = client.post("/api/command/cancel")
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"

    # ESP32 polls -> No command available
    poll_res = client.get("/api/command")
    assert poll_res.json()["command_available"] is False

# -------------------------------------------------------------
# TEST T7: Local Hardware Timer Execution & Partial/Fault Ack
# -------------------------------------------------------------
def test_t7_fault_ack_reporting(client):
    # Set up approved command
    client.post("/api/data", json={
        "moisture": 23.0, "soil_temp": 27.0, "ph": 6.4, "n": 60.0, "p": 50.0, "k": 70.0,
        "air_temp": 30.0, "humidity": 60.0
    })
    app_res = client.post("/api/command", json={
        "action_type": "APPROVE",
        "duration_s": 30.0,
        "channel": 1
    })
    approval_id = app_res.json()["approval_id"]

    # ESP32 executes but aborts mid-way due to sensor fault or safety trip
    ack_res = client.post("/api/ack", json={
        "approval_id": approval_id,
        "device_id": "esp32-01",
        "event_no": 1,
        "status": "ABORTED_FAULT",
        "actual_on_ms": 11200,
        "reason": "Soil probe disconnected mid-cycle"
    })
    assert ack_res.status_code == 200
    assert ack_res.json()["execution_status"] == "ABORTED_FAULT"

# -------------------------------------------------------------
# TEST T8: Replay Protection & Ack Idempotency
# -------------------------------------------------------------
def test_t8_ack_unknown_approval_id(client):
    # Posting an ack for a non-existent approval ID handles gracefully
    ack_res = client.post("/api/ack", json={
        "approval_id": "A-9999-99-99-9999",
        "device_id": "esp32-01",
        "event_no": 1,
        "status": "COMPLETED",
        "actual_on_ms": 5000,
        "reason": "Old replayed ack"
    })
    assert ack_res.status_code == 200
    # Returns ACK_RECEIVED_NO_ACTION_MATCH or matched fallback safely
    assert "ACK_" in ack_res.json()["status"]
