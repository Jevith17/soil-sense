#include "sensors.h"
#include "config.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include <DHTesp.h>

static OneWire oneWire(PIN_DS18B20);
static DallasTemperature ds18b20(&oneWire);
static DHTesp dht;

void initSensors() {
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db); // Full 0 - 3.3V range
    pinMode(PIN_SOIL_MOISTURE_ADC, INPUT);

    ds18b20.begin();
    ds18b20.setResolution(10); // 10-bit: ~187ms conversion time

    dht.setup(PIN_DHT22, DHTesp::DHT22);
}

SensorReadings samplePhysicalSensors() {
    SensorReadings r;

    // 1. Capacitive Soil Moisture Sensor (10-sample rolling average)
    long adcSum = 0;
    for (int i = 0; i < 10; i++) {
        adcSum += analogRead(PIN_SOIL_MOISTURE_ADC);
        delay(5);
    }
    r.moisture_raw = adcSum / 10;

    if (r.moisture_raw < ADC_DISCONNECTED_MIN || r.moisture_raw > ADC_DISCONNECTED_MAX) {
        // Electrical short, disconnected cable, or rail voltage error
        r.moisture = NAN;
        r.moisture_valid = false;
    } else {
        // Calibration mapping: AIR_ADC (high) = 0%, WATER_ADC (low) = 100%
        float pct = ((float)(CALIB_AIR_ADC - r.moisture_raw) / (float)(CALIB_AIR_ADC - CALIB_WATER_ADC)) * 100.0f;
        if (pct < 0.0f) pct = 0.0f;
        if (pct > 100.0f) pct = 100.0f;
        r.moisture = round(pct * 10.0f) / 10.0f;
        r.moisture_valid = true;
    }

    // 2. DS18B20 Soil Temperature
    ds18b20.requestTemperatures();
    float sTemp = ds18b20.getTempCByIndex(0);
    // Disconnection yields DEVICE_DISCONNECTED_C (-127°C); 85°C indicates read before conversion
    if (sTemp <= -55.0f || sTemp >= 84.9f && sTemp <= 85.1f) {
        r.soil_temp = NAN;
        r.soil_temp_valid = false;
    } else {
        r.soil_temp = round(sTemp * 10.0f) / 10.0f;
        r.soil_temp_valid = true;
    }

    // 3. DHT22 Air Temperature and Humidity
    TempAndHumidity dhtData = dht.getTempAndHumidity();
    if (isnan(dhtData.temperature) || dhtData.temperature < -40.0f || dhtData.temperature > 80.0f) {
        r.air_temp = NAN;
        r.air_temp_valid = false;
    } else {
        r.air_temp = round(dhtData.temperature * 10.0f) / 10.0f;
        r.air_temp_valid = true;
    }

    if (isnan(dhtData.humidity) || dhtData.humidity < 0.0f || dhtData.humidity > 100.0f) {
        r.humidity = NAN;
        r.humidity_valid = false;
    } else {
        r.humidity = round(dhtData.humidity * 10.0f) / 10.0f;
        r.humidity_valid = true;
    }

    return r;
}
