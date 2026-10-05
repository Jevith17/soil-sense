#include "pump_controller.h"
#include "config.h"
#include <ArduinoJson.h>

#define MAX_HISTORY_IDS 10
#define MAX_QUEUED_ACKS 6

static String executedApprovalIds[MAX_HISTORY_IDS];
static int executedIdCount = 0;

static String ackQueue[MAX_QUEUED_ACKS];
static int ackQueueHead = 0;
static int ackQueueTail = 0;
static int ackQueueCount = 0;

static PumpState currentState = PUMP_IDLE;
static ExecutionCommand activeCmd;
static int currentEvent = 0;
static unsigned long burstStartMs = 0;
static unsigned long burstDurationMs = 0;
static unsigned long intervalStartMs = 0;
static unsigned long intervalDurationMs = 0;

static void queueAck(const String& approval_id, int event_no, const String& status, unsigned long actual_on_ms, const String& reason) {
    if (ackQueueCount >= MAX_QUEUED_ACKS) {
        // Drop oldest to avoid overflow
        ackQueueHead = (ackQueueHead + 1) % MAX_QUEUED_ACKS;
        ackQueueCount--;
    }

    StaticJsonDocument<256> doc;
    doc["approval_id"] = approval_id;
    doc["device_id"] = DEVICE_ID;
    doc["event_no"] = event_no;
    doc["status"] = status;
    doc["actual_on_ms"] = actual_on_ms;
    doc["reason"] = reason;

    String jsonStr;
    serializeJson(doc, jsonStr);

    ackQueue[ackQueueTail] = jsonStr;
    ackQueueTail = (ackQueueTail + 1) % MAX_QUEUED_ACKS;
    ackQueueCount++;

    Serial.printf("[ACK QUEUED] approval_id=%s status=%s event=%d actual_on=%lums\n", 
                  approval_id.c_str(), status.c_str(), event_no, actual_on_ms);
}

void initPumpController() {
    // Relay module is active LOW: Initialize HIGH before setting as OUTPUT to avoid boot blip
    digitalWrite(PIN_RELAY_PUMP, HIGH);
    pinMode(PIN_RELAY_PUMP, OUTPUT);
    digitalWrite(PIN_RELAY_PUMP, HIGH);

    currentState = PUMP_IDLE;
}

bool startCommandExecution(const ExecutionCommand& cmd, String& rejectReason) {
    // 1. Replay Protection: Check if approval_id already executed
    if (cmd.approval_id.length() == 0) {
        rejectReason = "Empty approval ID";
        return false;
    }
    for (int i = 0; i < executedIdCount; i++) {
        if (executedApprovalIds[i] == cmd.approval_id) {
            rejectReason = "Replay violation: approval_id already executed";
            queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
            return false;
        }
    }

    // 2. Hard Limits Enforcement
    if (cmd.duration_s > MAX_ON_S) {
        rejectReason = "Safety hard cap exceeded: duration exceeds MAX_ON_S (60s)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }
    if (cmd.events > MAX_EVENTS) {
        rejectReason = "Safety hard cap exceeded: events exceed MAX_EVENTS (6)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }
    if (cmd.duration_s <= 0.0f) {
        rejectReason = "Invalid duration (<= 0)";
        queueAck(cmd.approval_id, 1, "REJECTED", 0, rejectReason);
        return false;
    }

    // 3. Mark approval_id in execution history
    executedApprovalIds[executedIdCount % MAX_HISTORY_IDS] = cmd.approval_id;
    if (executedIdCount < MAX_HISTORY_IDS) executedIdCount++;

    // 4. Setup state variables
    activeCmd = cmd;
    currentEvent = 1;
    burstDurationMs = (unsigned long)(cmd.duration_s * 1000.0f);
    intervalDurationMs = (unsigned long)(cmd.interval_s * 1000.0f);

    // 5. Activate Relay
    digitalWrite(PIN_RELAY_PUMP, LOW); // Active LOW -> Relay ON
    burstStartMs = millis();
    currentState = PUMP_BURST_ON;

    Serial.printf("[PUMP START] Approval=%s Event=1/%d Duration=%.1fs\n",
                  activeCmd.approval_id.c_str(), activeCmd.events, activeCmd.duration_s);
    return true;
}

void emergencyStopPump(const String& reason) {
    digitalWrite(PIN_RELAY_PUMP, HIGH); // Active LOW -> Relay OFF
    unsigned long actualOn = 0;
    if (currentState == PUMP_BURST_ON) {
        actualOn = millis() - burstStartMs;
    }
    currentState = PUMP_IDLE;
    Serial.printf("[EMERGENCY STOP] %s (Actual ON: %lu ms)\n", reason.c_str(), actualOn);

    if (activeCmd.approval_id.length() > 0) {
        queueAck(activeCmd.approval_id, currentEvent, "ABORTED_FAULT", actualOn, reason);
    }
}

void updatePumpController() {
    unsigned long now = millis();

    switch (currentState) {
        case PUMP_IDLE:
            // Ensure relay remains de-energized
            digitalWrite(PIN_RELAY_PUMP, HIGH);
            break;

        case PUMP_BURST_ON:
            if (now - burstStartMs >= burstDurationMs) {
                // Relay OFF
                digitalWrite(PIN_RELAY_PUMP, HIGH);
                unsigned long actualOn = now - burstStartMs;

                queueAck(activeCmd.approval_id, currentEvent, "EVENT_DONE", actualOn, "Pulse event completed");

                if (currentEvent >= activeCmd.events) {
                    // All pulse events complete
                    queueAck(activeCmd.approval_id, currentEvent, "COMPLETED", actualOn, "Prescription complete");
                    currentState = PUMP_IDLE;
                    Serial.println("[PUMP COMPLETED] All prescription events finished.");
                } else {
                    // Transition to inter-pulse interval
                    currentEvent++;
                    intervalStartMs = millis();
                    currentState = PUMP_BURST_INTERVAL_WAIT;
                    Serial.printf("[PUMP INTERVAL] Waiting %.1fs before event %d/%d\n",
                                  activeCmd.interval_s, currentEvent, activeCmd.events);
                }
            }
            break;

        case PUMP_BURST_INTERVAL_WAIT:
            if (now - intervalStartMs >= intervalDurationMs) {
                // Next pulse burst
                digitalWrite(PIN_RELAY_PUMP, LOW); // Relay ON
                burstStartMs = millis();
                currentState = PUMP_BURST_ON;
                Serial.printf("[PUMP EVENT %d/%d] Relay ON for %.1fs\n",
                              currentEvent, activeCmd.events, activeCmd.duration_s);
            }
            break;

        default:
            digitalWrite(PIN_RELAY_PUMP, HIGH);
            currentState = PUMP_IDLE;
            break;
    }
}

bool isPumpRunning() {
    return (currentState == PUMP_BURST_ON);
}

bool hasPendingAck() {
    return (ackQueueCount > 0);
}

String getPendingAckJson() {
    if (ackQueueCount == 0) return "";
    return ackQueue[ackQueueHead];
}

void clearPendingAck() {
    if (ackQueueCount > 0) {
        ackQueueHead = (ackQueueHead + 1) % MAX_QUEUED_ACKS;
        ackQueueCount--;
    }
}
