# Kisan Mitra — Multilingual AI Smart Farming Platform

> AI-powered crop intelligence for Indian farmers — voice & chat advisory, visual disease diagnosis, geospatial outbreak surveillance, and real-time APMC mandi market data.

**Production domain**: [https://kisanmitra.in](https://kisanmitra.in)

---

## Features

- **Farmer Dashboard** — Personalized crop weather advisories, farm metrics, and AI chat
- **Crop Doctor** — Upload a leaf photo for AI visual disease diagnosis, severity assessment, and treatment plans
- **Outbreak Radar** — Geospatial map of active regional pest and disease alerts
- **Harvest Guardian** — Predictive maturity modeling and ideal harvest window planning
- **Market Copilot** — Live APMC mandi wholesale price trends and AI trader-offer negotiation advice
- **Multilingual** — English, Malayalam, Hindi, Tamil
- **Admin Panel** — User management, disease alert publishing, market data, conversation audit

---

## Prerequisites

- **Node.js** v18 or higher
- **Google Gemini API Key** — get a free key at [Google AI Studio](https://aistudio.google.com/)

---

## Setup & Local Development

### 1. Install Dependencies

Install frontend (root) dependencies:
```bash
npm install
```

Install backend dependencies:
```bash
cd backend && npm install
```

### 2. Configure Environment Variables

In the `backend/` directory, copy the example env file and fill in your values:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional (defaults shown)
PORT=3001
JWT_SECRET=change_this_to_a_long_random_secret_in_production
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=development
```

> **Important**: Always set `JWT_SECRET` to a long, random string in production. Never commit `.env` to version control.

### 3. Run the Application

Start the **backend** (from project root):
```bash
cd backend && npm start
```
The Express API server starts at `http://localhost:3001` and initializes the SQLite database (`backend/kisan.db`) on first run.

Start the **frontend** (from project root):
```bash
npm run dev
```
The Vite dev server starts at `http://localhost:5173`. API calls are automatically proxied to the backend.

### 4. Open the App

Navigate to [http://localhost:5173](http://localhost:5173).

---

## Default Accounts

A default admin account is seeded on first database initialization:

| Role  | Email                      | Password   |
|-------|----------------------------|------------|
| Admin | `admin@kisanmitra.local`   | `admin123` |

Farmer accounts can be created through the `/register` page.

> **Change the admin password immediately in any non-local environment.**

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Shadcn UI |
| Charts | Recharts |
| Icons | Lucide React |
| Maps | Leaflet + React Leaflet |
| State | TanStack React Query |
| Backend | Node.js, Express |
| Database | SQLite via `better-sqlite3` |
| File uploads | Multer (local disk) |
| AI | Google Gemini API (`@google/generative-ai`) |
| Auth | JWT (`jsonwebtoken` + `bcryptjs`) |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend dev server |
| `npm run build` | Production build to `dist/` (no source maps) |
| `npm run lint` | ESLint check |
| `npm test` | Run backend automated test suite (7 tests) |

---

## Production Deployment

1. **Build the frontend**:
   ```bash
   npm run build
   ```
   Serve the `dist/` folder as static files (e.g. via Nginx or Caddy).

2. **Run the backend**:
   ```bash
   NODE_ENV=production node backend/server.js
   ```

3. **Reverse proxy** — Point `kisanmitra.in` to your server and terminate TLS at Nginx/Caddy. The backend already emits `Strict-Transport-Security` headers when `NODE_ENV=production`.

4. **Environment checklist**:
   - [ ] `GEMINI_API_KEY` set
   - [ ] `JWT_SECRET` set to a long random string
   - [ ] `NODE_ENV=production`
   - [ ] HTTPS / TLS configured at reverse proxy
   - [ ] `backend/kisan.db` directory is writable and persisted

---

## Project Structure

```
kisan-mitra-dashboard/
├── public/              # Static assets (favicon, robots.txt, sitemap.xml, llms.txt)
├── src/
│   ├── api/             # Base44 client and entity definitions
│   ├── components/      # Shared UI components (SEO, Header, Sidebar, etc.)
│   ├── lib/             # Auth context, farm context, translations, utilities
│   └── pages/           # Route-level page components (lazy-loaded)
├── backend/
│   ├── db.js            # SQLite schema and collection manager
│   ├── server.js        # Express app with security middleware
│   ├── routes/          # Auth and functions API routes
│   └── test/            # Automated backend tests
├── index.html           # SPA entry point with SEO meta and structured data
└── vite.config.js       # Build config with code splitting and chunk optimization
```
