#pragma once

#include <Arduino.h>

enum PumpState {
    PUMP_IDLE,
    PUMP_BURST_ON,
    PUMP_BURST_INTERVAL_WAIT,
    PUMP_COMPLETED,
    PUMP_FAULT_ABORTED
};

struct ExecutionCommand {
    String approval_id;
    int    channel;
    float  duration_s;
    int    events;
    float  interval_s;
};

void initPumpController();
bool startCommandExecution(const ExecutionCommand& cmd, String& rejectReason);
void emergencyStopPump(const String& reason);
void updatePumpController(); // Non-blocking state machine called every loop
bool isPumpRunning();
bool hasPendingAck();
String getPendingAckJson();
void clearPendingAck();
