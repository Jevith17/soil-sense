#pragma once

#include <Arduino.h>

enum LedPattern {
    LED_OFF,
    LED_SOLID,
    LED_SLOW_BLINK,    // Wi-Fi connecting / Idle normal
    LED_FAST_BLINK,    // Command executing / Pump ON
    LED_HEARTBEAT      // Telemetry sent
};

void initStatusLed();
void setLedPattern(LedPattern pattern);
void updateStatusLed();
