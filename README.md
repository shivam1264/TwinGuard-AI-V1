# TwinGuard-AI-V1 🏢🚨
### 3D Digital Twin Smart Fire & Crowd Evacuation Command Center

TwinGuard AI is an advanced, high-performance 3D Digital Twin application engineered with **Three.js**, **React 18**, and **Vite**. It models a realistic 10-storey commercial skyscraper with 100 individual rooms, dual stairwell emergency cores, high-speed panoramic elevator shafts, ground-floor muster zones, and real-time AI-optimized emergency evacuation pathfinding.

---

## 🌟 Key Features

- **Architectural 10-Storey BIM Skyscraper**:
  - 10 distinct vertical levels with realistic materials (wood parquet, slate carpet, polished marble tile).
  - 100 fully furnished enterprise rooms with workstations, ergonomic chairs, OLED monitors, conference boardrooms, executive suites, and lounge areas.
  - Realistic architectural tinted glass curtain walls with mullions.
  - Dynamic **Cutaway View** cross-section elevation vs. **Full Façade** exterior enclosure toggle (`C` key).

- **Multi-Level Crowd Evacuation Simulation**:
  - Over 200 autonomous humanoid agents with realistic walking, running, and limb articulation.
  - Anti-stampede congestion penalties and real-time route optimization.
  - Multi-flight switchback staircases (West Core A & East Core B) and South Grand Plaza Exit C.

- **Smart Fire & Hazard Detection**:
  - Interactive fire trigger bubble on room double-tap.
  - Dynamic volumetric flame particles, smoke drift, and flickering emergency point lights.
  - Dynamic hazard avoidance grid (`NavGrid` & `Pathfinder`) recalculating safe escape paths in real-time.

- **Facility CCTV Multiviewer**:
  - Real-time 15 FPS security camera canvas feeds for all 100 facility rooms.
  - Floor-by-floor camera filtering and room focus zoom.

- **Daylight Architectural Studio Environment**:
  - Clean light-theme daylight sky and fog (`#f1f5f9`).
  - Polished light travertine limestone plaza paving with blueprint grid overlay.
  - Balanced studio ambient, directional sunlight, and sky fill illumination.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or pnpm

### Installation
```bash
# Clone the repository
git clone https://github.com/shivam1264/TwinGuard-AI-V1.git

# Navigate to project directory
cd TwinGuard-AI-V1

# Install dependencies
npm install
```

### Running Locally
```bash
# Start both Backend Server & Vite Frontend concurrently
npm run dev

# Or run frontend only
npm run dev:client
```
Open your browser at `http://localhost:5173`.

### Production Build
```bash
npm run build
```

---

## 🕹️ Controls & Navigation

| Control | Action |
| :--- | :--- |
| **Left Click + Drag** | Rotate / Orbit camera |
| **Right Click + Drag** | Pan camera |
| **Scroll Wheel** | Zoom in / out |
| **W, A, S, D** | Walkthrough camera navigation |
| **Q / E** | Elevate camera Down / Up |
| **Shift** | Sprint camera walkthrough speed |
| **H** | Reset to Hero Section Elevation View |
| **C** | Toggle Cutaway Section vs Full Façade |
| **Double Click Room** | Open Emergency Fire Trigger Bubble |
