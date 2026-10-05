#pragma once

#include <Arduino.h>
#include "sensors.h"
#include "sensor_health.h"
#include "pump_controller.h"

void initWiFi();
void checkWiFiConnection();
bool sendTelemetry(const SensorReadings& readings, const EdgeHealthReport& health);
bool pollBackendCommand(ExecutionCommand& outCmd, bool& commandAvailable);
bool transmitAck(const String& ackJson);
