# SmartFarm AI — Arduino Uno Hardware & IoT Ingestion Architecture

## 1. Executive Summary

This document specifies the hardware integration architecture for **SmartFarm AI**, designed specifically for an **Arduino Uno R3 (ATmega328P)** microcontroller interfacing with a **Capacitive Soil Moisture Sensor v1.2**, a **16x2 I2C LCD display**, a **Piezo Buzzer**, and an **Automatic Irrigation DC Submersible Water Pump**.

Because the Arduino Uno does not feature onboard Wi-Fi (unlike ESP32), telemetry is routed through a resilient, authenticated **USB Serial Bridge**:
$$\text{Capacitive Sensor (A0)} \longrightarrow \text{Arduino Uno} \xrightarrow[\text{9600 Baud}]{\text{USB Serial}} \text{Laptop Serial Bridge} \xrightarrow[\text{Bearer Token}]{\text{HTTP POST}} \text{Next.js Telemetry API} \longrightarrow \text{Prisma DB} \longrightarrow \text{Dashboard}$$

---

## 2. Complete Pinout & Wiring Table

| Component | Pin on Component | Arduino Uno Pin | Description |
| :--- | :--- | :--- | :--- |
| **Capacitive Moisture Sensor v1.2** | VCC | **5V** (or 3.3V) | Power supply |
| | GND | **GND** | Ground reference |
| | AOUT | **A0** | Analog voltage output (10-bit ADC: 0–1023) |
| **16x2 LCD (with I2C PCF8574)** | VCC | **5V** | Power supply |
| | GND | **GND** | Ground reference |
| | SDA | **A4** (SDA) | I2C Serial Data |
| | SCL | **A5** (SCL) | I2C Serial Clock (Address: `0x27` or `0x3F`) |
| **Piezo Buzzer** | Positive (+) | **D8** | Digital PWM / Tone output for low moisture alert |
| | Negative (-) | **GND** | Ground |
| **5V Relay Module (for Pump)** | VCC | **5V** | Relay coil power |
| | GND | **GND** | Ground reference |
| | IN / Signal | **D7** | Active LOW control signal from ATmega328P |
| **DC Water Pump (3–6V)** | Positive (+) | **External Battery (+)** | **NEVER connect to Arduino 5V or GPIO!** |
| | Negative (-) | **Relay COM / NO** | Switched through Relay Common & Normally Open |

---

## 3. Critical Electrical & Circuit Safety Rules

> [!CAUTION]
> ### NEVER POWER OR SWITCH A WATER PUMP DIRECTLY FROM ARDUINO GPIO!
> 1. **Overcurrent Hazard:** An ATmega328P GPIO pin has an absolute maximum continuous current limit of **40 mA** (recommended operational limit: **20 mA**). A small 3–6V DC submersible water pump draws **250 mA to 600 mA** during stall/start. Connecting it directly to a GPIO pin will permanently burn out the microcontroller output pin driver.
> 2. **Inductive Kickback (Back-EMF):** DC motors are inductive loads ($V = L \frac{di}{dt}$). When turned off, the collapsing magnetic field generates a reverse voltage spike exceeding **50V to 100V**. Without a reverse-biased **1N4007 flyback diode** across the motor terminals, this back-EMF spike will propagate into the Arduino and destroy the board.
> 3. **External Power Isolation:** The DC water pump MUST be powered by an external battery pack (e.g., 4×AA batteries or 18650 cell). Connect the pump's ground to the battery ground. Connect the external battery positive through the Relay `COM` (Common) and `NO` (Normally Open) terminals.

If an external relay or MOSFET driver is not available during evaluation, the firmware runs safely in **Simulation / Indication Mode**: Pin D7 simply toggles an LED or the buzzer sounds to demonstrate irrigation triggering without drawing harmful current.

---

## 4. Capacitive Soil Moisture Sensor Calibration

The Capacitive Soil Moisture Sensor v1.2 uses high-frequency capacitance measurement rather than resistive conduction, preventing electrolytic corrosion of copper probes in damp soil.

The Arduino Uno 10-bit ADC reads values from **0 to 1023**:
- **Dry Air (0% Moisture):** $\approx 580 - 620$ ADC counts (default baseline: `rawDry = 595`).
- **Water Saturated (100% Moisture):** $\approx 260 - 300$ ADC counts (default baseline: `rawWet = 280`).

$$\text{Moisture \%} = \text{constrain}\left(\frac{\text{rawDry} - \text{rawMoisture}}{\text{rawDry} - \text{rawWet}} \times 100.0, \; 0.0, \; 100.0\right)$$

*Notice that capacitive sensors exhibit an inverse voltage relationship: higher water content increases capacitance, pulling the output voltage down.*

---

## 5. How to Run the Live Hardware Pipeline

### Step 1: Upload Arduino Firmware
1. Open the Arduino IDE.
2. Open [`hardware/arduino/smartfarm_uno/smartfarm_uno.ino`](file:///c:/Users/hetul/Downloads/Minor%20project/Farming/hardware/arduino/smartfarm_uno/smartfarm_uno.ino).
3. Under **Tools > Board**, select **Arduino Uno**.
4. Under **Tools > Port**, select the COM port of your connected Arduino (e.g., `COM3`, `COM4`).
5. Ensure the `LiquidCrystal_I2C` library is installed via Library Manager (or set `#define ENABLE_LCD 0` if not using an LCD).
6. Click **Upload** (Ctrl+U).

### Step 2: Start the SmartFarm AI Application
In a terminal inside `Farming/`:
```bash
npm run dev
```
Verify the dashboard loads at `http://localhost:3000`.

### Step 3: Start the Serial-to-Cloud Bridge
In a second terminal inside `Farming/`:
```bash
# Auto-detects connected Arduino COM port
node scripts/arduino-serial-bridge.mjs

# Or specify your exact COM port:
node scripts/arduino-serial-bridge.mjs --port=COM3

# Or if hardware is disconnected during testing, run software simulation:
node scripts/arduino-serial-bridge.mjs --demo
```

### Step 4: Live Dashboard Verification
1. Navigate to `http://localhost:3000/soil-moisture` or `http://localhost:3000/dashboard`.
2. Dip the capacitive probe into moist soil or a cup of water.
3. Observe the live ADC reading, percentage gauge, 16x2 LCD display, and real-time dashboard chart update instantaneously!
