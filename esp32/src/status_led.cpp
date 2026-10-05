#include "status_led.h"
#include "config.h"

static LedPattern currentPattern = LED_SLOW_BLINK;
static unsigned long lastToggleMs = 0;
static bool ledState = false;

void initStatusLed() {
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);
}

void setLedPattern(LedPattern pattern) {
    currentPattern = pattern;
}

void updateStatusLed() {
    unsigned long now = millis();

    switch (currentPattern) {
        case LED_OFF:
            digitalWrite(PIN_STATUS_LED, LOW);
            break;

        case LED_SOLID:
            digitalWrite(PIN_STATUS_LED, HIGH);
            break;

        case LED_SLOW_BLINK:
            if (now - lastToggleMs >= 1000) {
                lastToggleMs = now;
                ledState = !ledState;
                digitalWrite(PIN_STATUS_LED, ledState ? HIGH : LOW);
            }
            break;

        case LED_FAST_BLINK:
            if (now - lastToggleMs >= 150) {
                lastToggleMs = now;
                ledState = !ledState;
                digitalWrite(PIN_STATUS_LED, ledState ? HIGH : LOW);
            }
            break;

        case LED_HEARTBEAT:
            // Single quick flash
            if (now - lastToggleMs < 100) {
                digitalWrite(PIN_STATUS_LED, HIGH);
            } else {
                digitalWrite(PIN_STATUS_LED, LOW);
            }
            break;
    }
}
