import random
from datetime import datetime, timezone
from typing import Dict, Any
from app.models.reading import Reading

class SensorSimulator:
    """
    ESP32 Hardware Telemetry Simulator.
    Simulates physical sensor behavior including ADC counts and comparator logic.
    """

    @classmethod
    def generate_reading(cls, scenario: str = "NORMAL", pump_status: str = "OFF") -> Reading:
        scenario = scenario.upper()
        now = datetime.now(timezone.utc)

        # Base noise to keep readings lively and realistic
        noise = lambda scale: random.uniform(-scale, scale)

        if scenario == "DRY_SOIL":
            # Exactly demo benchmark parameters
            reading = Reading(
                timestamp=now,
                moisture=round(27.0 + noise(0.8), 1),
                soil_temp=round(29.0 + noise(0.4), 1),
                ph=round(6.4 + noise(0.05), 2),
                n=round(64.0 + noise(1.0), 1),
                p=round(51.0 + noise(1.0), 1),
                k=round(73.0 + noise(1.0), 1),
                air_temp=round(33.0 + noise(0.5), 1),
                humidity=round(65.0 + noise(1.0), 1),
                solar=round(910.0 + noise(15.0), 0),
                ch4=round(18.0 + noise(0.5), 1),
                co2=round(620.0 + noise(10.0), 0),
                pump_status=pump_status,
                data_source="SIMULATED",
                device_id="SIMULATOR-DRY",
                analog_moisture_raw=3300, # High ADC count = dry soil
                digital_moisture_raw=1    # 1 = dry threshold tripped
            )

        elif scenario == "WET_SOIL":
            reading = Reading(
                timestamp=now,
                moisture=round(74.0 + noise(1.0), 1),
                soil_temp=round(22.0 + noise(0.3), 1),
                ph=round(6.6 + noise(0.05), 2),
                n=round(80.0 + noise(2.0), 1),
                p=round(58.0 + noise(1.0), 1),
                k=round(82.0 + noise(2.0), 1),
                air_temp=round(23.0 + noise(0.5), 1),
                humidity=round(84.0 + noise(1.5), 1),
                solar=round(320.0 + noise(20.0), 0),
                ch4=round(22.0 + noise(0.5), 1),
                co2=round(530.0 + noise(10.0), 0),
                pump_status=pump_status,
                data_source="SIMULATED",
                device_id="SIMULATOR-WET",
                analog_moisture_raw=1100, # Low ADC count = wet
                digital_moisture_raw=0    # 0 = wet
            )

        elif scenario == "LOW_N":
            reading = Reading(
                timestamp=now,
                moisture=round(48.0 + noise(0.8), 1),
                soil_temp=round(25.0 + noise(0.3), 1),
                ph=round(6.3 + noise(0.05), 2),
                n=round(28.0 + noise(1.0), 1), # Low Nitrogen < 50
                p=round(48.0 + noise(1.0), 1),
                k=round(62.0 + noise(1.5), 1),
                air_temp=round(26.0 + noise(0.5), 1),
                humidity=round(62.0 + noise(1.0), 1),
                solar=round(680.0 + noise(15.0), 0),
                ch4=round(15.0 + noise(0.5), 1),
                co2=round(570.0 + noise(10.0), 0),
                pump_status=pump_status,
                data_source="SIMULATED",
                device_id="SIMULATOR-LOW-N",
                analog_moisture_raw=2200,
                digital_moisture_raw=0
            )

        elif scenario == "SENSOR_FAILURE":
            # Moisture sensor disconnected or sending invalid voltage
            reading = Reading(
                timestamp=now,
                moisture=142.0, # Impossible out-of-range value (>100%)
                soil_temp=round(27.0 + noise(0.3), 1),
                ph=round(6.4 + noise(0.05), 2),
                n=round(65.0 + noise(1.0), 1),
                p=round(50.0 + noise(1.0), 1),
                k=round(70.0 + noise(1.0), 1),
                air_temp=round(29.0 + noise(0.5), 1),
                humidity=round(60.0 + noise(1.0), 1),
                solar=round(750.0 + noise(15.0), 0),
                ch4=round(17.0 + noise(0.5), 1),
                co2=round(600.0 + noise(10.0), 0),
                pump_status="OFF",
                data_source="SIMULATED",
                device_id="SIMULATOR-FAULT",
                analog_moisture_raw=4095, # Saturated ADC rail
                digital_moisture_raw=1
            )

        elif scenario == "POST_IRRIGATION":
            reading = Reading(
                timestamp=now,
                moisture=round(51.2 + noise(0.5), 1), # Satisfied target
                soil_temp=round(26.5 + noise(0.3), 1),
                ph=round(6.45 + noise(0.05), 2),
                n=round(63.0 + noise(1.0), 1),
                p=round(50.5 + noise(1.0), 1),
                k=round(72.0 + noise(1.0), 1),
                air_temp=round(30.0 + noise(0.5), 1),
                humidity=round(68.0 + noise(1.0), 1),
                solar=round(820.0 + noise(15.0), 0),
                ch4=round(18.0 + noise(0.5), 1),
                co2=round(610.0 + noise(10.0), 0),
                pump_status="OFF",
                data_source="SIMULATED",
                device_id="SIMULATOR-POST-IRR",
                analog_moisture_raw=2050,
                digital_moisture_raw=0
            )

        else: # NORMAL
            reading = Reading(
                timestamp=now,
                moisture=round(52.0 + noise(1.0), 1),
                soil_temp=round(25.0 + noise(0.3), 1),
                ph=round(6.5 + noise(0.05), 2),
                n=round(75.0 + noise(1.5), 1),
                p=round(52.0 + noise(1.0), 1),
                k=round(76.0 + noise(1.5), 1),
                air_temp=round(26.5 + noise(0.5), 1),
                humidity=round(60.0 + noise(1.0), 1),
                solar=round(620.0 + noise(20.0), 0),
                ch4=round(16.0 + noise(0.5), 1),
                co2=round(560.0 + noise(10.0), 0),
                pump_status=pump_status,
                data_source="SIMULATED",
                device_id="SIMULATOR-NORMAL",
                analog_moisture_raw=2000,
                digital_moisture_raw=0
            )

        return reading

