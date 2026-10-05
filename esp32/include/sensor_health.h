#pragma once

#include <Arduino.h>
#include "sensors.h"

struct EdgeHealthReport {
    String moisture_status;   // "NORMAL", "CHECK", "FAULT"
    String soil_temp_status;
    String air_temp_status;
    String humidity_status;
    String overall_status;    // "NORMAL", "CHECK", "FAULT"
};

EdgeHealthReport evaluateEdgeHealth(const SensorReadings& readings);
