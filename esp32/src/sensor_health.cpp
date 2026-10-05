#include "sensor_health.h"

EdgeHealthReport evaluateEdgeHealth(const SensorReadings& readings) {
    EdgeHealthReport rep;

    // Moisture check
    if (!readings.moisture_valid) {
        rep.moisture_status = "FAULT";
    } else if (readings.moisture < 5.0f || readings.moisture > 95.0f) {
        rep.moisture_status = "CHECK";
    } else {
        rep.moisture_status = "NORMAL";
    }

    // Soil temperature check
    if (!readings.soil_temp_valid) {
        rep.soil_temp_status = "FAULT";
    } else if (readings.soil_temp < 0.0f || readings.soil_temp > 50.0f) {
        rep.soil_temp_status = "CHECK";
    } else {
        rep.soil_temp_status = "NORMAL";
    }

    // Air temperature check
    if (!readings.air_temp_valid) {
        rep.air_temp_status = "FAULT";
    } else if (readings.air_temp < 5.0f || readings.air_temp > 48.0f) {
        rep.air_temp_status = "CHECK";
    } else {
        rep.air_temp_status = "NORMAL";
    }

    // Humidity check
    if (!readings.humidity_valid) {
        rep.humidity_status = "FAULT";
    } else if (readings.humidity < 10.0f || readings.humidity > 95.0f) {
        rep.humidity_status = "CHECK";
    } else {
        rep.humidity_status = "NORMAL";
    }

    // Overall aggregation
    if (rep.moisture_status == "FAULT" || rep.soil_temp_status == "FAULT" ||
        rep.air_temp_status == "FAULT" || rep.humidity_status == "FAULT") {
        rep.overall_status = "FAULT";
    } else if (rep.moisture_status == "CHECK" || rep.soil_temp_status == "CHECK" ||
               rep.air_temp_status == "CHECK" || rep.humidity_status == "CHECK") {
        rep.overall_status = "CHECK";
    } else {
        rep.overall_status = "NORMAL";
    }

    return rep;
}
