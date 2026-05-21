#  SECTOR-42 // TSOC

**Tactical Survival & Operations Command Terminal**

A premium, dark-mode tactical command dashboard built for post-apocalyptic colony management. Track perimeter defenses, manage dwindling resources, dispatch scavenger squads, decode Morse transmissions, and synchronize with other survivors — all from a single CRT-styled terminal interface.

---

## Features

### Perimeter Defense & Threat Radar
Interactive SVG map of the Sector-42 colony layout. Click any sector node — watchtowers, gate checkpoints, farms, medical bay — to inspect threat levels, assign sentinels, and log security incidents in real-time.

###  Resource & Ration Command
Track water, food rations, med-kits, ammunition, and diesel fuel reserves. A built-in **Burn Rate Calculator** dynamically forecasts how many days of supplies remain based on active population count, posted sentinel expenditure, and daily intake rates.

### Expedition & Scavenge Planner
Plan scavenging missions to points of interest across the wasteland. The system calculates a dynamic **Risk Score** (Low → Extreme) based on distance, time of day, squad size, and gear loadout. Active expeditions stream simulated radio comm logs in real-time.

###  Shortwave Radio & Morse Utility
- **Morse Encoder**: Type plaintext and transmit as synthesized 750 Hz audio beeps or full-screen visual light flashes.
- **Tactile Telegraph Key**: Tap to input Morse code manually — short click for dot, hold for dash — with live character decoding.
- **Frequency Spectrometer**: Tune an analog dial across the 140–150 MHz band to intercept simulated emergency broadcasts and mesh network chatter.

### Survival Field Manual
Searchable, offline-ready database of critical survival procedures — infection quarantine protocols, chemical water filtration, weapon maintenance, generator cold-start sequences, and expedition retreat tactics.

###  Local Mesh Offline Sync
Export and import the entire system state as a compact JSON packet. Designed for zero-bandwidth environments where data must travel over shortwave packet radio or physical USB transfer between isolated bunkers.

###  Low-Power Mode
One-click toggle strips all CRT scanline overlays, glow animations, and visual effects — switching to a high-contrast monochrome terminal optimized for battery conservation on rugged field hardware.

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | React 18 |
| **Build Tool** | Vite 5 |
| **Icons** | Lucide React |
| **Styling** | Vanilla CSS (custom CRT design system) |
| **Fonts** | Orbitron · Share Tech Mono · Inter |
| **Audio** | Web Audio API (oscillator synthesis) |
| **Runtime** | Bun / Node.js |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or [Node.js](https://nodejs.org/) v18+

### Installation

```bash
# Clone the repository
git clone https://github.com/SabeeirSharrma/ridhima.git
cd ridhima

# Install dependencies
bun install

# Start the development server
bun run dev
```

The terminal will boot at **http://localhost:3000/**

### Production Build

```bash
bun run build
```

Static assets are compiled to the `dist/` directory.

---

##  Project Structure

```
ridhima/
├── index.html                          # HTML entrypoint with SEO & Google Fonts
├── package.json                        # Dependencies & scripts
├── vite.config.js                      # Vite configuration
├── instructions.txt                    # Detailed operational procedures
├── src/
│   ├── main.jsx                        # React DOM mount
│   ├── index.css                       # CRT design system & CSS variables
│   ├── App.jsx                         # Global state controller & tab router
│   └── components/
│       ├── RadarMap.jsx                # Interactive SVG perimeter defense map
│       ├── InventoryTracker.jsx        # Resource reserves & burn rate calculator
│       ├── ExpeditionPlanner.jsx       # Squad dispatch & risk projection engine
│       ├── MorseRadio.jsx             # Morse encoder, telegraph key & frequency tuner
│       ├── Manual.jsx                  # Searchable survival field manual
│       └── MeshSync.jsx               # Offline JSON telemetry sync system
```

---

##  Design Philosophy

The interface is crafted around a **military-grade CRT terminal aesthetic**:

- **Neon amber/orange** primary palette against deep cyber-dark backgrounds
- **Scanline overlays** and subtle screen flicker for authentic CRT feel
- **Glassmorphic panels** with corner bracket accents
- **LED status indicators** with pulsing glow animations
- **Radar sweep** conic gradient animation on the defense map
- **Monochrome fallback** for low-power/low-bandwidth scenarios

---

##  Mesh Sync JSON Schema

To synchronize state between terminals, export/import packets follow this structure:

```json
{
  "population": 42,
  "inventory": [
    { "key": "food", "quantity": 180 },
    { "key": "water", "quantity": 450 },
    { "key": "medicine", "quantity": 18 },
    { "key": "ammo", "quantity": 340 },
    { "key": "fuel", "quantity": 95 }
  ],
  "sectors": [
    { "id": "gate-a", "status": "secure", "guards": 2 },
    { "id": "wt-1", "status": "alert", "guards": 1 },
    { "id": "farms", "status": "secure", "guards": 0 }
  ]
}
```

---

##  Shortwave Frequency Reference

| Frequency | Channel | Threat Level |
|-----------|---------|-------------|
| 142.10 MHz | CO-HQ Emergency | 🟢 Safe |
| 145.80 MHz | Survivalist Mesh | 🟡 Alert |
| 148.50 MHz | Distress Beacon WT-3 | 🔴 Danger |


<p align="center">
  <strong>SECTOR-42 TSOC</strong> — <em>Survive. Defend. Adapt.</em>
</p>
