/**
 * SmartFarm AI — Arduino Uno Soil Moisture Telemetry Node
 * =======================================================
 * Project: SmartFarm AI (Final-Year Academic Project)
 * Target MCU: Arduino Uno R3 (ATmega328P, 16 MHz, 5V Logic)
 * 
 * Hardware Wiring:
 * ----------------
 * 1. Capacitive Soil Moisture Sensor v1.2:
 *    - VCC  -> 5V
 *    - GND  -> GND
 *    - AOUT -> Pin A0 (10-bit ADC: 0 - 1023)
 * 
 * 2. 16x2 I2C LCD Display (PCF8574 Backpack):
 *    - VCC  -> 5V
 *    - GND  -> GND
 *    - SDA  -> Pin A4 (Uno I2C Data)
 *    - SCL  -> Pin A5 (Uno I2C Clock)
 *    - Address: 0x27 (if blank/unresponsive, change to 0x3F)
 * 
 * ⚠️ ELECTRICAL SAFETY & PUMP NOTICE ⚠️
 * -------------------------------------
 * The mini DC water pump and buzzer are KEPT ELECTRICALLY DISCONNECTED for safety.
 * Switching a DC motor directly from an Arduino GPIO pin exceeds the 20mA limit
 * and creates high-voltage inductive back-EMF spikes that destroy the ATmega328P.
 * The pump state is reported as "NOT_CONNECTED" (Monitoring & Advisory Mode).
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Try 0x27 first. If LCD shows solid blocks or blank text, adjust contrast pot or test 0x3F.
LiquidCrystal_I2C lcd(0x27, 16, 2);

const int SENSOR_PIN = A0;

// Calibration values for 10-bit ADC (0 - 1023)
// In capacitive v1.2 sensors: air is higher ADC counts, water is lower ADC counts.
// Replace these with your own measured stable readings in dry air vs moist soil.
const int DRY_RAW = 595;   // Sensor in dry air (0% moisture baseline)
const int WET_RAW = 280;   // Sensor submerged in water (100% moisture baseline)

// Agronomic Advisory Thresholds (%)
const int DRY_THRESHOLD = 30;  // Below this: Irrigation recommended
const int WET_THRESHOLD = 60;  // Above this: No irrigation needed

unsigned long lastSend = 0;
const unsigned long SEND_INTERVAL = 2000; // 2 seconds between telemetry packets

int readMoistureRaw() {
  long total = 0;
  for (int i = 0; i < 10; i++) {
    total += analogRead(SENSOR_PIN);
    delay(10);
  }
  return total / 10;
}

int calculatePercentage(int raw) {
  if (DRY_RAW == WET_RAW) return 0;
  // Capacitive sensor reads higher when dry, lower when wet
  float percentage = ((float)(DRY_RAW - raw) * 100.0) / (float)(DRY_RAW - WET_RAW);
  percentage = constrain(percentage, 0, 100);
  return (int)(percentage + 0.5);
}

void setup() {
  Serial.begin(9600);
  while (!Serial && millis() < 3000);

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("SmartFarm AI");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(1500);
  lcd.clear();

  // Safe boot event
  Serial.println("{\"deviceId\":\"UNO-001\",\"event\":\"DEVICE_STARTED\",\"pumpState\":\"NOT_CONNECTED\",\"mode\":\"MONITORING\"}");
}

void loop() {
  unsigned long now = millis();

  if (now - lastSend >= SEND_INTERVAL) {
    lastSend = now;
    int raw = readMoistureRaw();
    int moisture = calculatePercentage(raw);

    String soilStatus;
    String recommendation;

    if (moisture < DRY_THRESHOLD) {
      soilStatus = "DRY";
      recommendation = "IRRIGATION_RECOMMENDED";
    } else if (moisture < WET_THRESHOLD) {
      soilStatus = "MODERATE";
      recommendation = "MONITOR_SOIL";
    } else {
      soilStatus = "WET";
      recommendation = "NO_IRRIGATION_NEEDED";
    }

    // Update 16x2 I2C LCD Display
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Moisture: ");
    lcd.print(moisture);
    lcd.print("%");
    lcd.setCursor(0, 1);
    lcd.print(soilStatus);
    lcd.print(" - ");
    lcd.print(moisture < DRY_THRESHOLD ? "Irrigate" : "Monitor");

    // Emit single-line JSON packet to Laptop over USB Serial at 9600 baud
    Serial.print("{\"deviceId\":\"UNO-001\"");
    Serial.print(",\"moistureRaw\":");
    Serial.print(raw);
    Serial.print(",\"moisturePct\":");
    Serial.print(moisture);
    Serial.print(",\"soilStatus\":\"");
    Serial.print(soilStatus);
    Serial.print("\",\"recommendation\":\"");
    Serial.print(recommendation);
    Serial.print("\",\"pumpState\":\"NOT_CONNECTED\"");
    Serial.print(",\"mode\":\"MONITORING\"");
    Serial.println("}");
  }

  delay(20);
}
