#pragma once

#include <Arduino.h>

struct SensorReadings {
    int   moisture_raw;
    float moisture;          // % (0 - 100), or NAN if fault
    bool  moisture_valid;

    float soil_temp;         // °C, or NAN if fault
    bool  soil_temp_valid;

    float air_temp;          // °C, or NAN if fault
    bool  air_temp_valid;

    float humidity;          // % RH, or NAN if fault
    bool  humidity_valid;
};

void initSensors();
SensorReadings samplePhysicalSensors();
