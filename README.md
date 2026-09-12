# Kisan Mitra

> **AI-Powered Smart Farming Platform for Indian Agriculture**
>
> Multilingual voice and chat advisory, AI visual plant disease diagnosis, geospatial pest outbreak surveillance, real-time APMC mandi market intelligence, and predictive harvest readiness modeling.

**Production Site**: [kisanmitra.in](https://kisanmitra.in)

---

## Key Features

### 1. Farmer Dashboard
- **Hyperlocal Advisories**: Daily harvest windows, canopy moisture, ground traction, and shatter risk.
- **Agronomic Modules**: Direct access to crop health diagnostics, pest alerts, and APMC rates.
- **Radial Maturity Dial**: Real-time visualization of crop growth cycle progress.

### 2. Crop Doctor (Disease Diagnosis)
- **Visual Leaf Diagnostics**: Upload photos of affected leaves for instant AI disease identification.
- **3-Stage Treatment Plans**: Immediate containment, targeted spray schedules, and organic bio-controls.
- **Dynamic Dosage Calculator**: Computes exact chemical and water volume based on field acreage.
- **Prescription Tools**: Text-to-Speech playback in regional languages and one-click WhatsApp sharing.

### 3. Market Copilot (APMC Mandi Intelligence)
- **15-Day Price Trajectory**: Real-time wholesale prices vs. Government Minimum Support Price (MSP).
- **Net Freight Calculator**: Ranks nearby mandis by net profit after calculating transport, labor, and cess.
- **Trader Offer Evaluator**: Evaluates middleman offers with instant verdicts and bargaining scripts in English, Malayalam, and Hindi.

### 4. Outbreak Radar (Geospatial Surveillance)
- **Interactive Pest Perimeter**: Live Leaflet map displaying reported infestations within your radius.
- **Microclimate & Wind Tracking**: Predicts spore and insect migration trajectories based on weather vectors.
- **Community Reporting**: Verified farmers can report field outbreaks to alert neighboring farms.

### 5. Harvest Guardian (Maturity & Weather Simulation)
- **Dual-Engine Model**: Combines thermal Growing Degree Days (GDD) and continuous grain moisture desorption ODEs with Google Gemini AI.
- **7-Day Weather Radar**: Monitors rainfall risk to identify optimal dry harvest windows.
- **Field Inspection Checklist**: Customizable on-field physical maturity verification list.
- **Storage & Spoilage Prevention**: Temperature and moisture thresholds to prevent post-harvest mold and aflatoxins.

### 6. Ask Kisan Mitra (AI Assistant)
- **Multimodal Interaction**: Ask farming questions via voice, text, or photo.
- **Bilingual & Regional**: Full support for English, Malayalam, Hindi, and Tamil.

### 7. Profile & Preferences
- **Farmer Identity**: Upload profile photo, view Kisan ID, and configure contact details.
- **Cultivation Details**: Manage farm size, primary crop, soil type, and irrigation methods.
- **Notification Controls**: Custom toggles for harvest alerts, disease warnings, and price shifts.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Shadcn UI |
| **Data & State** | TanStack React Query, React Router v6 |
| **Maps & Charts** | Leaflet, React Leaflet, Recharts |
| **Backend API** | Node.js, Express.js |
| **Database** | SQLite via `better-sqlite3` (with automatic JSON fallback store) |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`, Gemini 3.5 Flash) |
| **Agronomic Engine** | Continuous Moisture Desorption ODE (ASABE Standards D245.7) / MATLAB Core |
| **Authentication** | JWT (`jsonwebtoken`, `bcryptjs`) |

---

## Getting Started

### Prerequisites
- **Node.js** (v20 LTS, v22, or v24 recommended)
- **npm** (v9 or higher)
- **Google Gemini API Key** (Get a free key from [Google AI Studio](https://aistudio.google.com/))

---

### Installation & Local Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Stealth-Striker/kisan-mitra-dashboard.git
cd kisan-mitra-dashboard
```

#### 2. Install Dependencies

Install root (frontend) dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

#### 3. Set Up Environment Variables

Create `.env` in the `backend/` directory:
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and add your Gemini API key:
```env
# Required
GEMINI_API_KEY=your_google_gemini_api_key_here

# Optional configuration (defaults shown)
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
GEMINI_MODEL=gemini-3.5-flash
NODE_ENV=development
```

---

### Running the App

#### Start Backend Server
From the project root:
```bash
cd backend
npm run dev
```
> Tip: `npm run dev` starts the backend with live file-watching (`node --watch`). You can also run `npm start` for standard mode.

The API server will run at: `http://localhost:3001` (SQLite database initializes automatically with fallback support).

#### Start Frontend Client
In a separate terminal, from the project root:
```bash
npm run dev
```
The Vite development server will run at: `http://localhost:5173`

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Default Accounts

When the database is first initialized, a default administrator account is created:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@kisanmitra.local` | `admin123` |

> Farmer accounts can be registered directly at `/register`.

---

## Project Structure

```
kisan-mitra-dashboard/
├── backend/                  # Express.js REST API
│   ├── routes/               # Auth, farm entities, and AI functions
│   ├── services/             # Agronomic ODE solver & Gemini bridge
│   ├── test/                 # Automated API test suite
│   ├── db.js                 # SQLite database initialization
│   └── server.js             # Express entry point
├── src/                      # React frontend
│   ├── api/                  # Base44 API client
│   ├── components/           # Reusable UI components & layouts
│   ├── lib/                  # AuthContext, FarmContext, translations
│   └── pages/                # Route pages (Dashboard, CropDoctor, MarketCopilot, etc.)
├── matlab/                   # MATLAB / Simulink drying models & ODE scripts
│   ├── harvest_bio_growth_model.m
│   └── README.md
├── public/                   # Static icons, manifest, and SEO assets
├── package.json              # Frontend scripts & dependencies
└── vite.config.js            # Vite build configuration
```

---

## Available Scripts

| Command | Action |
|---|---|
| `npm run dev` | Starts Vite frontend dev server |
| `npm run build` | Builds optimized production bundle in `dist/` |
| `npm test` | Runs backend automated test matrix (35 tests across 7 suites) |
| `cd backend && npm run dev` | Starts Express backend server with live reload (`node --watch`) |
| `cd backend && npm start` | Starts Express backend server in standard mode |

---

## Production Deployment

1. **Build Frontend**:
   ```bash
   npm run build
   ```
2. **Start Backend**:
   ```bash
   NODE_ENV=production node backend/server.js
   ```
3. **Reverse Proxy (Nginx / Caddy)**:
   - Route `/api` and `/auth` to `http://localhost:3001`.
   - Serve `dist/` static files for all other routes.
   - Configure TLS / HTTPS certificates.

---

## License

This project is licensed under the MIT License.
