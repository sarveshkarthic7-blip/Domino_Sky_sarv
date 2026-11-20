# ✈️ DOMINO SKY — Flight Disruption Cascade & Recovery Simulator

> **PromptWars 2026 AI Build Challenge**  
> An interactive, professional Airline Operations Control Centre (OCC) simulation platform demonstrating deterministic disruption propagation, passenger connection preservation, crew duty compliance, and AI-assisted tactical recovery.

---

## 🎯 1. Project Objective & Overview

When an airport closes due to severe weather, technical failure, or runway incidents, the consequences rarely remain localized. Due to **tight aircraft rotations**, **connecting passenger transfers**, and **strict flight crew duty limits (DGCA/FAA)**, a 90-minute closure at a primary hub like Mumbai (BOM) ripples across the entire national airspace, causing cascading delays throughout the operating day.

**DOMINO SKY** puts operations controllers and dispatchers in command of an interactive, deterministic simulation engine that models:
1. **Airport Ground Stops & Holding Programs** (inbound & outbound closure windows).
2. **Aircraft Rotation Propagation** (strict enforcement of mandatory 30-minute minimum turnaround times).
3. **Passenger Transfer Integrity** (tracking 21 hub connection pairs against published Minimum Connection Times).
4. **Flight Crew Duty Period Compliance** (real-time monitoring against the 600-minute / 10-hour legal duty limit).
5. **Interactive Operations Recovery Strategies**:
   - **Option 1: Spare Aircraft Swap** (swapping idle spare aircraft VT-DS17 at BLR or VT-DS18 at DEL into broken rotations).
   - **Option 2: Tactical Flight Cancellation** (strategic cancellation of round trips to reset aircraft position and avert crew duty violations).
6. **Side-by-Side Before vs. After Recovery Benchmarks** (quantitative metrics and delay reduction charts).
7. **Secure Google Gemini AI Operations Copilot** (executive briefings, root-cause explanations, and actionable dispatch recommendations with zero hallucination).

---

## 📊 2. The Dataset

DOMINO SKY strictly loads and preserves the supplied [`flight_network.json`](src/data/flight_network.json):
* **16 Airports**: 4 Mega Hubs (DEL, BOM, BLR, HYD), 4 Regional Hubs (MAA, CCU, AMD, COK), and 8 Spoke Stations (GOI, PNQ, JAI, GAU, LKO, IXC, BBI, TRV).
* **70 Scheduled Flights**: Flown across sequential leg rotations.
* **16 Active Aircraft (`VT-DS01` to `VT-DS16`)**: Standard 180-seat configuration.
* **2 Dedicated Spare Aircraft**:
  - `VT-DS17` based at **BLR** (Available from 05:00 IST, 180 seats).
  - `VT-DS18` based at **DEL** (Available from 05:00 IST, 180 seats).
* **21 Passenger Connection Pairs**: Detailed baggage transfer itineraries with minimum connection times (40–45 mins).
* **16 Flight Crew Rosters (`CR01` to `CR16`)**: Tracking duty start, tail assignment, and 600-minute maximum Flight Duty Period (FDP).

*No data is invented, estimated, or replaced with random dummy values.*

---

## ⚙️ 3. Deterministic Simulation Engine Architecture

At the heart of DOMINO SKY is a pure, deterministic simulation engine (`src/engine/simulation.ts`):

```
                        [ Disruption Event ]
               Airport Closure: [Start Time, Duration]
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Outbound Flights ]                              [ Inbound Flights ]
Earliest Dep = max(Sched, ClosureEnd)             Ground Stop Program at Origin
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  ▼
                     [ Aircraft Rotation Chain ]
         Earliest Dep(Leg k) = max(Sched, ActualArr(Leg k-1) + 30m)
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
[ Passenger Connection Check ]                     [ Crew Duty Check ]
Gap = ActualDep(To) - ActualArr(From)              Actual Duty = Last Arr - Duty Start
Safe if Gap >= MinConnectTime (40-45m)             Violation if Duty > 600m
Broken if Gap < MinConnectTime                     Warning if Duty >= 555m (within 45m)
```

### Documented Simulation Assumptions:
1. **Deterministic Time Representation**: All timings are converted into integer minutes from midnight ($0 \dots 1439$).
2. **Turnaround Compression**: The scheduled gap (`turnaround_before_min`) is absorbed down to `min_turnaround_minutes: 30`. Delays propagate to subsequent legs only when incoming arrival + 30 minutes exceeds scheduled departure.
3. **Ground Delay Program (GDP)**: Inbound flights scheduled to land during airport closure are held at origin to prevent airborne fuel burn; their departure is delayed so they arrive at reopen time. Flights already airborne before closure start hold in the air until the runway reopens.
4. **Spare Aircraft Base Constraint**: A spare aircraft can only be swapped onto a flight departing from its stationed base airport (`BLR` for `VT-DS17`, `DEL` for `VT-DS18`). Once swapped, the spare aircraft operates the remainder of the rotation on time, detaching downstream legs from the delayed inbound tail.
5. **Tactical Cancellation Mechanics**: When a flight is cancelled, its departure delay is cleared. The aircraft remains stationed at the origin airport. If subsequent legs originate from that same airport (e.g. after a round-trip cancellation), they depart on time.

---

## 🤖 4. Secure Google Gemini AI Integration

### Architecture:
* **Strict Server-Side Isolation**: The frontend never accesses or exposes the `GEMINI_API_KEY`. All AI queries route through `POST /api/ai/explain` on the Express backend (`server/index.js`).
* **Zero Hallucination Guardrail**: The simulation engine calculates all numerical values (flights, delay minutes, broken transfers, passengers, crew overages). Structured JSON is passed to Gemini 2.5 Flash, which is instructed to act strictly as an operations interpreter.
* **Deterministic Fallback Engine**: If no Gemini API key is configured or the service is offline, the backend automatically invokes an internal operational reasoning generator to deliver structured executive briefings.

---

## 🛠️ 5. Technology Stack

* **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons.
* **Visualization & Charts**: Interactive SVG Geographic Airspace Radar, Recharts for before-and-after bar charts.
* **Backend**: Node.js, Express, CORS, Dotenv.
* **Testing**: Vitest unit test suite covering 100% of simulation rules.
* **AI Runtime**: Google Gemini 2.5 Flash API via secure proxy.

---

## 🚀 6. Setup & Execution Instructions

### Prerequisites:
* macOS / Linux / Windows
* Node.js v18+ and npm installed (or using the included tools bundle)

### Quick Start:
```bash
# 1. Clone or navigate to the project directory
cd "DOMINO SKY"

# 2. Configure Gemini API Key (Optional - Fallback works out-of-the-box)
cp .env.example .env
# Edit .env and paste: GEMINI_API_KEY=your_key_here

# 3. Install dependencies
npm install

# 4. Run the Vitest test suite
npm test

# 5. Build for production
npm run build

# 6. Launch the complete system (Backend Server + Frontend UI)
npm start
```

* Backend API: `http://localhost:3001`
* Frontend Dashboard: `http://localhost:5173`

---

## 🧪 7. Test Results

Run `npm test` to execute the comprehensive test suite (`tests/simulation.test.ts`):
* ✅ Dataset integrity & constant verification (16 airports, 70 flights, 21 connections, 16 crews, 2 spares).
* ✅ Normal baseline schedule (0 delays, 0 broken connections, 0 crew violations).
* ✅ Airport closure calculation & delay propagation (BOM 07:30 90m scenario).
* ✅ Mandatory 30-minute aircraft turnaround constraint propagation across multi-leg rotations.
* ✅ Deterministic repeatability across multiple runs.
* ✅ Passenger connection shortfall detection.
* ✅ Crew duty monitoring and legal exceedance alerts (>600m).
* ✅ Spare aircraft swap validation (base airport constraint & capacity check).
* ✅ Flight cancellation & downstream rotation shielding.
* ✅ Before-and-after comparison engine delta calculations.

---

## 🎤 8. Hackathon 8-Minute Demonstration Script

Use this proven walkthrough during judge evaluations:

| Time | Step | Action | Key Talking Points |
|---|---|---|---|
| **0:00 - 1:00** | **Introduction** | Show Header & Control Room | *"Welcome to DOMINO SKY. In modern aviation, closing a single runway creates an immediate chain reaction. Here is our live operations control centre monitoring 70 flights across 16 airports in India."* |
| **1:00 - 2:00** | **Baseline State** | Show normal KPIs (0 delays) | *"Under normal conditions, our 16 aircraft operate on time with zero broken connections and compliant crew rosters."* |
| **2:00 - 3:30** | **Inject Disruption** | Click **"Load Demo (BOM 07:30)"** | *"At 07:30 IST, Mumbai Airport (BOM) closes for 90 minutes. Watch the simulation engine calculate the impact deterministically: 16 flights delayed, 755 minutes of cumulative delay, 6 broken passenger connections stranding 199 passengers, and multiple crews entering duty alert zones."* |
| **3:30 - 4:30** | **Airspace Radar & Connections** | Open Route Radar & Connections Tab | *"On our live airspace radar, see the amber corridors propagating out of Mumbai to Ahmedabad and Delhi. At Delhi, flight DS1203 arrived late, causing connecting flight DS0903 to miss its transfer window by 5 minutes."* |
| **4:30 - 5:30** | **Crew Duty Monitoring** | Open Crew Tab | *"DGCA mandates a 600-minute maximum duty period. Notice Crew CR12 (AMD base) jumping from 515 minutes to 545 minutes, triggering an amber high-risk alert."* |
| **5:30 - 6:30** | **Execute Recovery** | Go to **Recovery Center** → Swap `VT-DS18` on `DS1204` at DEL | *"Let's act as operations controllers. Spare aircraft VT-DS18 is parked idle at Delhi from 05:00. We swap it onto flight DS1204. Because the spare is already at Delhi, DS1204 departs on time, breaking the delay propagation cascade!"* |
| **6:30 - 7:30** | **Before & After Matrix** | Open Before & After Matrix | *"Look at the quantitative comparison: our recovery action immediately saved 30 minutes of delay, recovered flight DS1204, and protected downstream operations."* |
| **7:30 - 8:00** | **AI Operations Copilot** | Open AI Copilot Tab | *"Finally, our AI Operations Copilot synthesizes the exact calculation metrics into an executive briefing for dispatchers, explaining root causes, transfer shortfalls, and mitigation steps."* |

---

## 🏆 Standout Highlights for PromptWars 2026

1. **100% Deterministic Engine**: Zero random numbers, zero AI hallucinations.
2. **True Aviation Logic**: Real Ground Delay Programs, DGCA crew rules, turnaround buffers, and base-constrained spare swaps.
3. **Resilient Production Architecture**: Full TypeScript type safety, secure backend AI proxy, and instant offline fallback.
4. **Operations Control Centre (OCC) UI/UX**: Aviation-grade dark theme, real-time IST clock, live radar, and interactive drawers.
