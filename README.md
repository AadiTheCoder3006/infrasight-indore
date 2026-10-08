# InfraSight – Indore Infrastructure Monitor (Full-Stack)

A production-grade, full-stack civic infrastructure intelligence platform inspired by **InfraSight (Indore Municipal Corporation - Swachh & Surakshit Indore)**.

InfraSight combines interactive GIS mapping, computer vision AI hazard detection, citizen reporting, and municipal officer triage workflows to streamline hazard reporting and resolution across Indore's 85 wards.

---

## 🌟 Key Features

### 1. Citizen Portal & Interactive City Map
- **Interactive Leaflet Map**: Centered on Indore, MP (`22.7196° N, 75.8577° E`) with custom color-coded hazard markers (Roads & Potholes, Water Supply, Lighting, Waste, Footpath, Traffic & Signals).
- **Live Stats Bar**: Real-time totals for reported issues, critical hazards, active resolutions, and average turnaround time.
- **Priority Queue**: Dynamic filtering by category, ward, status, and severity index.
- **Detailed Hazard Drawer**:
  - High-resolution hazard photography with **AI Bounding Box Overlay** (`class_name · confidence %`).
  - **AI Severity Index** calculated from hazard size, location, and proximity.
  - **Connected Hazard Telemetry**: Radar warnings for adjacent critical infrastructure (e.g. schools, bus stops, metro corridors).
  - **Corroboration & Merge Tracking**: Automatically links duplicate citizen reports to single incidents.
  - **Department Dispatch & Audit Timeline**: Full transparency from citizen report to field crew repair verification.

### 2. Citizen Reporting Flow (`/report` & `/report/success/:id`)
- **Real-Time Computer Vision Scanner (`/reports/scan`)**: Instant edge AI simulation analyzing uploaded photos to classify defect type, compute confidence score, and project bounding box coordinates.
- **Interactive Location Pinpoint**: Click or drag to set precise GPS coordinates anywhere across Indore.
- **Ward & Landmark Selection**: Native support for Indore Wards 1 through 85 (Vijay Nagar, Palasia, Rajwada, Bhawarkua, Annapurna, Sapna Sangeeta, etc.).
- **Ticket Tracking**: Auto-generates official Indore Municipal Corporation reference codes (e.g. `IMC-2026-11495`).

### 3. Citizen Tracking Portal (`/my-reports` & `/my-reports/:id`)
- Track complaints by IMC ticket ID or citizen mobile number.
- 4-step progress stepper: `Reported` ➔ `Acknowledged` ➔ `In Progress` ➔ `Fixed & Verified`.
- Review before/after repair proof photos and field officer notes.

### 4. Municipal Officer & Admin Portal (`/admin`, `/admin/heatmap`, `/admin/verification`)
- **Issue Triage (`/admin/issues`)**: Priority queue across Indore wards, one-click status transitions, and automated crew dispatch notices.
- **City Heatmap & GIS Analytics (`/admin/heatmap`)**: Real-time density and severity heatmap layer across Indore zones with category filters and ward vulnerability metrics.
- **Repair Verification Audit (`/admin/verification`)**: Side-by-side Before/After inspection tool with AI confidence verification and one-click official sign-off.

---

## 🏗 Architecture & Tech Stack

- **Backend**: Node.js & Express REST API (`server.js`)
- **Database**: Persistent JSON/SQLite storage (`src/database.js` & `database.json`) pre-seeded with realistic Indore civic infrastructure telemetry.
- **AI Vision Engine**: Neural hazard detector simulation (`src/ai_vision.js`) supporting potholes, broken streetlights, water pipeline bursts, overflowing garbage bins, broken footpath slabs, and traffic signal malfunctions.
- **Frontend**: High-performance Single Page Application with Leaflet GIS mapping, FontAwesome 6 icons, Google Fonts (Bricolage Grotesque, Inter, DM Sans), and responsive layout.
- **Static Assets**: High-resolution civic hazard imagery stored in `/public`.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Full Stack Application
```bash
npm start
# or
node server.js
```

The application runs at **`http://localhost:8000`**.

### 3. Run Automated API Test Suite
```bash
npm test
# or
node test_api.js
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | `GET` | Health check and server status |
| `/stats` | `GET` | Aggregated Indore infrastructure metrics & 7-day velocity |
| `/issues` | `GET` | Filtered issues list (`type`, `status`, `area`, `min_score`, `limit`) |
| `/issues/:id` | `GET` | Full details for an issue including timeline, AI detections, and complaints |
| `/issues/mine` | `GET` | List of reports filed by current citizen |
| `/issues/:id/status` | `PATCH` | Update status (`Reported`, `Acknowledged`, `In Progress`, `Fixed`) with officer audit trail |
| `/issues/:id/verify-repair` | `POST` | Upload repair photo and trigger AI resolution verification |
| `/issues/:id/complaint/send` | `POST` | Dispatch formal escalation notification to department engineers |
| `/heatmap` | `GET` | Indore GIS coordinates with severity heat weights |
| `/reports/scan` | `POST` | AI Computer Vision analysis on uploaded defect image |
| `/reports` | `POST` | Submit new citizen infrastructure report |

*(All endpoints are also available under the `/api/*` prefix, e.g. `/api/issues`, `/api/stats`)*

---

## 📂 Project Directory Structure

```
├── package.json               # Node.js dependencies & scripts
├── server.js                  # Main Express full stack server & SPA fallback
├── test_api.js                # End-to-end automated API test suite
├── database.json              # Active persistent database
├── public/                    # Static assets & frontend build
│   ├── index.html             # Application HTML entry point
│   ├── logo.png               # Official InfraSight Indore logo
│   ├── pothole.jpg            # High-res sample defect photography
│   ├── traffic_signal.jpg     # Traffic signal hazard photography
│   ├── pipeline.jpg           # Water pipeline burst photography
│   ├── streetlight.jpg        # Dark streetlight corridor photography
│   ├── garbage.jpg            # Waste management hazard photography
│   ├── footpath.jpg           # Pedestrian footpath defect photography
│   ├── uploads/               # Uploaded citizen evidence & repair proof photos
│   └── assets/                # Production JS bundle & Tailwind/CSS styles
└── src/
    ├── database.js            # Database engine with persistence & filtering
    ├── ai_vision.js           # AI Computer Vision detection & bounding box model
    ├── data/
    │   └── seed_issues.json   # Pre-seeded Indore municipal infrastructure records
    └── routes/
        ├── health.js          # Health endpoint
        ├── stats.js           # Civic analytics & chart data
        ├── issues.js          # Issue management & triage routes
        ├── reports.js         # Report filing & AI scanning routes
        └── heatmap.js         # GIS heatmap coordinates
```
