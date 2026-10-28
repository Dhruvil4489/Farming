# SmartFarm AI — IoT Sensor Hardware Build & Calibration Specification

> **Deployment Status Disclosure:**  
> **Hardware Status:** ⚠️ **Physical Hardware Assembly & Field Deployment: PENDING**  
> **Simulation Status:** ✅ **Software Telemetry Simulator: VERIFIED & ACTIVE** (`scripts/simulate-iot.mjs`)  
> In adherence to academic integrity guidelines, physical breadboard deployment in an actual agricultural plot is marked pending until live field testing. In-situ telemetry ingestion has been rigorously verified using the protocol-identical software simulator.

---

## 1. Planned Bill of Materials (BOM)

| Component | Specification | Estimated Cost (INR) | Purpose |
|---|---|---|---|
| **Microcontroller** | ESP32-WROOM-32 Development Board (30-pin) | ₹450 | WiFi/BLE connectivity, ADC sampling, Deep Sleep control, HTTPS client |
| **Soil Moisture Sensor** | Capacitive Soil Moisture Sensor v1.2 (Corrosion Resistant) | ₹120 | Measures soil dielectric permittivity without electrolysis corrosion |
| **Ambient Temperature & Humidity** | DHT22 (AM2302) or SHT31-D (I2C) | ₹280 | Ambient air temperature and relative humidity monitoring |
| **Power Management** | TP4056 Micro-USB / Type-C 1A Li-Ion Charger Module with Protection | ₹45 | Battery over-charge and over-discharge cutoff (2.5V low cutoff) |
| **Energy Storage** | 18650 Rechargeable Li-Ion Cell (3.7V, 2600mAh) | ₹220 | Power source for field deployment |
| **Voltage Divider** | $100\text{ k}\Omega$ + $100\text{ k}\Omega$ 1% precision metal film resistors | ₹10 | Divides battery voltage by 2 for safe reading on ESP32 3.3V ADC |
| **Enclosure** | IP65 Weatherproof Junction Box with Cable Gland | ₹180 | Protection against rain, direct sunlight, and field dust |
| **Total Estimated BOM** | — | **~₹1,305** | Budget-accessible for smallholder deployment |

---

## 2. Pin Mapping & Wiring Diagram

```
+-------------------------------------------------------------+
|                     ESP32-WROOM-32                          |
|                                                             |
|   [ 3V3 ] ───► VCC (Capacitive Moisture Sensor v1.2)        |
|   [ 3V3 ] ───► VCC (DHT22 Sensor)                           |
|   [ GND ] ───► Common Ground (Sensors, Battery, Divider)    |
|                                                             |
|   [ GPIO 34 (ADC1_CH6) ] ◄─── AOUT (Capacitive Soil Sensor) |
|   [ GPIO 4  ]            ◄─── DATA (DHT22 with 10k pullup)  |
|   [ GPIO 35 (ADC1_CH7) ] ◄─── Voltage Divider Center (V_bat)|
+-------------------------------------------------------------+
```

### Pin Table
| Sensor / Peripheral | ESP32 Pin | Pin Function | Electrical Constraints |
|---|---|---|---|
| Capacitive Moisture Analog Out | `GPIO 34` | ADC1 Channel 6 | Input only; max 3.3V; no internal pull-up/pull-down |
| DHT22 Data Line | `GPIO 4` | Digital GPIO | Requires $10\text{ k}\Omega$ pull-up resistor to 3.3V |
| Battery Voltage Divider | `GPIO 35` | ADC1 Channel 7 | Input only; center of $100\text{ k}\Omega / 100\text{ k}\Omega$ divider |
| Sensor Power Rail (VCC) | `3V3` | 3.3V Output | Power sensors only from 3.3V, NOT VIN/5V |
| Common Ground | `GND` | Ground Reference | Star-ground topology to minimize analog ADC noise |

---

## 3. Critical Electrical & Environmental Cautions

1. **3.3V Logic vs. 5V Warning**:
   - The ESP32 is strictly a **3.3V logic device**. Supplying 5V to any GPIO pin will destroy the ESP32 input gate.
   - Certain cheap capacitive sensors on the market are designed for 5V and output analog signals up to 4.2V. Always verify the voltage on the sensor's analog output pin using a multimeter before connecting to `GPIO 34`.
2. **Capacitive vs. Resistive Probes**:
   - Resistive soil moisture probes (exposed copper traces) experience galvanic corrosion within 3–7 days of continuous current in wet soil.
   - **Only Capacitive Soil Moisture Sensors v1.2** should be used. The sensor PCB edges must be sealed with silicone conformal coating to prevent water seeping into internal copper traces.
3. **ADC Non-Linearity on ESP32**:
   - ESP32 ADCs exhibit non-linear behavior below 0.1V and above 3.1V. Use 11dB attenuation (`ADC_ATTEN_DB_11`) and calibrate in the linear operating band (0.15V to 2.8V).
4. **Deep-Sleep Power Optimization**:
   - Continuous WiFi transmission exhausts a 2600mAh battery in under 36 hours.
   - The probe must sleep in **Deep Sleep mode** for 55 minutes, wake for 10 seconds to sample sensors and transmit HTTPS telemetry, then return to sleep ($I_{sleep} \approx 15\mu\text{A}$), extending battery life to 6–9 months.

---

## 4. Soil Moisture ADC Calibration Mathematical Model

The raw analog output ($ADC_{raw}$) of a capacitive sensor decreases as moisture increases (higher dielectric constant increases capacitance, lowering circuit frequency and voltage):

### Two-Point Calibration Formula
Given:
- $ADC_{dry}$: Sensor reading in dry air ($\approx 3200$ at 12-bit resolution)
- $ADC_{wet}$: Sensor reading fully submerged in plain water ($\approx 1400$)

The unadjusted volumetric moisture percentage ($M_{unadj}$) is:
$$M_{unadj} = \left( \frac{ADC_{dry} - \text{clamp}(ADC_{raw}, ADC_{wet}, ADC_{dry})}{ADC_{dry} - ADC_{wet}} \right) \times 100$$

### Soil Texture Correction Offset
Different soil textures have distinct water retention capacities (field capacity vs. wilting point):
$$M_{calibrated} = \text{clamp}\left( M_{unadj} + \Delta_{soil}, 0\%, 100\% \right)$$

Where:
- Sandy Soil: $\Delta_{soil} = -5\%$ (Drains rapidly; lower retention)
- Loam / Alluvial Soil: $\Delta_{soil} = 0\%$ (Baseline reference)
- Clay / Black Cotton Soil (Vertisol): $\Delta_{soil} = +5\%$ (High water retention capacity)

```typescript
// Verified reference implementation from tests/unit-validators-calculations.test.ts
export function calibrateSoilMoisture(rawAdc: number, rawDry = 3200, rawWet = 1400, soilType = 'loam'): number {
  const boundedAdc = Math.max(Math.min(rawAdc, rawDry), rawWet);
  let pct = ((rawDry - boundedAdc) / (rawDry - rawWet)) * 100;
  if (soilType === 'sandy') pct -= 5;
  if (soilType === 'clay') pct += 5;
  return Math.max(0, Math.min(100, Math.round(pct * 10) / 10));
}
```

---

## 5. Software Simulator Guide (`scripts/simulate-iot.mjs`)

Because physical hardware deployment is pending, the repository provides a protocol-identical software simulator. The simulator transmits authentic HTTP packets with SHA-256 Bearer tokens to `/api/v1/iot/telemetry`.

### Simulation Scenarios

#### 1. Soil Depletion & Irrigation Spike (`dry_to_wet`)
Simulates moisture depleting from 65% down to critical 22% (triggering irrigation alert), followed by a sudden pump pulse restoring moisture to 78%:
```bash
node scripts/simulate-iot.mjs --scenario=dry_to_wet --count=6
```

#### 2. Diurnal Solar Weather Cycle (`diurnal_weather`)
Simulates a 24-hour day/night cycle: temperatures rise, humidity drops during noon peak, and battery voltage fluctuates realistically:
```bash
node scripts/simulate-iot.mjs --scenario=diurnal_weather --count=8
```

#### 3. Idempotency & Packet Retry (`duplicate_retry`)
Emits duplicate packets with the identical UUID `eventId` to prove server deduplication works:
```bash
node scripts/simulate-iot.mjs --scenario=duplicate_retry
```

#### 4. Invalid Payload & Boundary Rejection (`invalid_payload`)
Transmits out-of-range sensor readings to prove the server's non-clamping validation logic:
```bash
node scripts/simulate-iot.mjs --scenario=invalid_payload
```

---

## 6. Physical Hardware Demo Procedure (When Assembled)

When demonstrating with physical breadboard hardware:
1. Power ESP32 via Micro-USB or 18650 battery.
2. Observe serial output at 115200 baud (`[WiFi] Connected to SmartFarm AP`, `[NVS] Loaded Device Token`).
3. Place sensor in dry ambient air: verify serial outputs $ADC \approx 3200$, UI indicates $0\% \text{ moisture}$ (`status: "critical_dry"`).
4. Insert sensor into a cup of moist soil: observe analog voltage drop to $ADC \approx 2100$, UI indicates $52\% \text{ moisture}$ (`status: "optimal"`).
5. Add 50ml water: observe voltage drop to $ADC \approx 1500$, UI updates in real-time to $85\% \text{ moisture}$ (`status: "wet"`).
