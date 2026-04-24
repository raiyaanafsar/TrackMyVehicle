# TrackMyVehicle

A real-time IoT vehicle monitoring dashboard built with an ESP32 microcontroller, Node.js WebSocket backend, and a React dashboard. Tracks live GPS location, speed, accelerometer data, and automatically detects driving events like collisions, rash driving, towing, and toppling.

---

## Features

- **Live Tracking** — Real-time GPS position on an interactive map with path history
- **Live Speed Gauge** — Color-coded speed display (green → amber → red)
- **Accelerometer Monitor** — Live X/Y/Z axis bars with resultant G-force magnitude
- **Drive Status** — Instant event detection (Normal, Collision, Rash Driving, Towing, Toppling)
- **Sensor Analytics** — Sectioned charts: velocity, 3-axis motion feed, G-force, impact intensity
- **Journey Intelligence** — Incident breakdown, mean trip speed, risk profile doughnut
- **System Logs** — Live session log, stored log with pagination, anomaly-only filter
- **Animated Splash Screen** — 2-second branded intro on load
- **Dark Cyber Theme** — Deep navy + electric cyan design throughout

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework and build tool |
| Material UI (MUI) v9 | Component library and dark theming |
| React Leaflet + Leaflet | Interactive map with CartoDB Voyager tiles |
| Chart.js + react-chartjs-2 | Real-time telemetry charts |
| React Router v7 | Client-side routing |
| Emotion | CSS-in-JS styling |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express v5 | HTTP server and REST API |
| ws (WebSocket) | Real-time bidirectional data from ESP32 and to browser |
| Mongoose + MongoDB Atlas | Telemetry data persistence |
| dotenv | Environment variable management |
| cors | Cross-origin request handling |

### IoT Hardware
| Component | Purpose |
|---|---|
| ESP32 | Main microcontroller with WiFi |
| MPU6050 | 6-axis accelerometer + gyroscope |
| GPS Module (NEO-6M or similar) | Location and speed data |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ESP32 Device                         │
│  GPS Module ──► Speed, Lat, Lon                         │
│  MPU6050    ──► Accel X, Y, Z + Event Detection        │
│                    │                                    │
│              WebSocket Client                           │
└──────────────────────│──────────────────────────────────┘
                       │  ws://backend-url/ws
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Node.js Backend                        │
│                                                         │
│  WebSocket Server (/ws)                                 │
│    ├── Receives telemetry from ESP32                    │
│    ├── Broadcasts to all browser clients                │
│    └── Saves to MongoDB (critical events immediately,   │
│         normal events every 10 seconds)                 │
│                                                         │
│  REST API (/api)                                        │
│    ├── GET /api/history    → last 50 records            │
│    ├── GET /api/logs       → paginated log              │
│    └── GET /api/analytics  → event counts + avg speed   │
└──────────────────────│──────────────────────────────────┘
                       │  WebSocket + REST
                       ▼
┌─────────────────────────────────────────────────────────┐
│                React Dashboard                          │
│                                                         │
│  ├── Live Tracking  (Map + side panel)                  │
│  ├── Sensor Analytics  (Charts in sections)             │
│  └── System Logs  (Tables with tabs + pagination)       │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
TrackMyVehicle/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   └── Telemetry.js          # Mongoose schema
│   ├── routes/
│   │   └── telemetryRoutes.js    # REST API endpoints
│   ├── sockets/
│   │   └── wsHandler.js          # WebSocket handler
│   ├── server.js                 # Express + WS server entry point
│   ├── .env                      # ⚠️ Not committed — see setup below
│   └── package.json
│
├── iot-dashboard/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # AppBar, Drawer, alerts
│   │   │   └── SplashScreen.jsx  # Animated intro screen
│   │   ├── context/
│   │   │   └── WebSocketContext.jsx  # Global WS state + REST fetches
│   │   ├── pages/
│   │   │   ├── MapPage.jsx       # Live Tracking page
│   │   │   ├── ChartsPage.jsx    # Sensor Analytics page
│   │   │   └── LogsPage.jsx      # System Logs page
│   │   ├── App.jsx               # MUI dark theme + routing
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── ESP32/                        # Arduino sketch for the ESP32 device
    └── ...
```

---

## Prerequisites

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **MongoDB Atlas** account — [mongodb.com/atlas](https://www.mongodb.com/atlas) (free tier works)
- **ESP32** development board with GPS and MPU6050 sensors (for live data)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Rahul1227/TrackMyVehicle.git
cd TrackMyVehicle
```

---

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
HOST=0.0.0.0
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vehicle_tracker?retryWrites=true&w=majority
CLEAR_DB_ON_START=false
```

> **MONGODB_URI** — Get this from your MongoDB Atlas dashboard:  
> Clusters → Connect → Connect your application → copy the connection string  
> Replace `<username>`, `<password>`, and `<cluster>` with your values.

> **CLEAR_DB_ON_START** — Set to `true` if you want to wipe the database every time the server starts (useful during development).

Start the backend:

```bash
node server.js
```

The server will be running at `http://localhost:8000`.  
WebSocket endpoint: `ws://localhost:8000/ws`

---

### 3. Frontend setup

```bash
cd iot-dashboard
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.

---

### 4. ESP32 setup

1. Open the sketch in the `ESP32/` folder using **Arduino IDE** or **PlatformIO**
2. Install the required libraries:
   - `WebSockets` by Markus Sattler
   - `ArduinoJson`
   - `TinyGPS++` (if using GPS module)
   - `Adafruit MPU6050`
3. Update the sketch with your WiFi credentials and backend address:

```cpp
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* wsHost   = "192.168.x.x";   // your PC's local IP
const int   wsPort   = 8000;
const char* wsPath   = "/ws";
```

4. Flash the sketch to the ESP32
5. Open Serial Monitor at 115200 baud to confirm connection

> **Finding your PC's local IP:**  
> Windows: run `ipconfig` in Command Prompt → look for IPv4 Address  
> macOS/Linux: run `ifconfig` → look for `inet` under your WiFi interface

---

## Dashboard Pages

### Live Tracking
- Interactive map (CartoDB Voyager tiles) with real-time vehicle marker
- Direction-aware arrow marker when moving, dot when stationary
- Path history polyline toggle
- Right panel: speed gauge, GPS coordinates, drive status badge, live accelerometer bars

### Sensor Analytics
Three visual sections, each with a heading bar and charts side-by-side:

| Section | Charts |
|---|---|
| **Live Telemetry** | Vehicle Velocity, 3-Axis Motion Feed |
| **Motion Analysis** | Resultant G-Force, Impact Intensity |
| **Journey Intelligence** | Incident Breakdown, Mean Trip Speed, Risk Profile |

### System Logs
- **Live Log** — real-time events from the current WebSocket session
- **Stored Log** — paginated history from MongoDB
- **Event Log** — anomaly-only filtered view

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/history` | Latest 50 telemetry records |
| `GET` | `/api/logs?page=1&limit=15` | Paginated logs |
| `GET` | `/api/logs?filter=anomalies` | Anomaly events only |
| `GET` | `/api/analytics` | Event counts and average speed |
| `WS` | `/ws` | WebSocket endpoint for ESP32 and browser |

### WebSocket Message Format (ESP32 → Backend)

```json
{
  "lat": 29.8649,
  "lon": 77.8966,
  "speed": 42,
  "x": 0.12,
  "y": -0.05,
  "z": 0.98,
  "event": "normal"
}
```

**Event types:** `normal` · `collision` · `rash_driving` · `tow` · `toppling`

---

## Event Detection Logic

Events are detected on the ESP32 based on sensor thresholds:

| Event | Trigger condition |
|---|---|
| `collision` | Sudden high acceleration magnitude spike |
| `rash_driving` | High jerk (rapid acceleration change) |
| `tow` | Sustained Z-axis tilt while speed is zero |
| `toppling` | Extreme Z-axis deviation |
| `normal` | None of the above |

Critical events are saved to MongoDB **immediately**. Normal events are saved at most once every **10 seconds** to reduce database writes.

---

## Deployment

See the full deployment notes in the project. Quick summary:

| Part | Recommended Platform |
|---|---|
| Backend | Railway / Render / Fly.io (needs persistent WebSocket support) |
| Frontend | Vercel / Netlify |
| Database | MongoDB Atlas (already cloud-hosted) |

For deployment, replace the hardcoded `localhost:8000` in `WebSocketContext.jsx` and `LogsPage.jsx` with a `VITE_BACKEND_URL` environment variable, and update the ESP32 sketch with the deployed backend hostname.

---

## License

MIT
