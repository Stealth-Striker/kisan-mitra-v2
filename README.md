# Kisan Mitra — Standalone AI Farming Companion

Kisan Mitra is a multilingual AI farming assistant designed for Indian farmers. It features:
- **Crop Doctor**: AI-powered crop leaf disease diagnosis from uploaded leaf photos.
- **AI Chat (Kisan Mitra)**: Interactive advice on crops, pests, timing, and practices in English, Malayalam, Hindi, and Tamil.
- **Outbreak Radar**: Local monitoring and mapping of active disease outbreaks.
- **Market Copilot**: AI-guided trader negotiation using real-time wholesale market price trends.

This project runs completely standalone without any external platform dependency.

---

## Prerequisites

- **Node.js** (v18 or higher recommended)
- **Google Gemini API Key** (Required for the AI features. Get a free key at [Google AI Studio](https://aistudio.google.com/))

---

## Setup & Local Development

1. **Install Dependencies**:
   Install root dependencies (frontend):
   ```bash
   npm install
   ```
   Install backend dependencies:
   ```bash
   cd backend
   ```
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   In the `backend/` directory, create a `.env` file (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Open `backend/.env` and add your **Gemini API Key**:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

3. **Start the Application**:
   You need to run both the backend and frontend servers:

   - **Start Backend** (from `backend/` directory):
     ```bash
     npm run dev
     ```
     This runs the backend server at `http://localhost:3001` and initializes the local JSON database (`backend/kisan_db.json`).

   - **Start Frontend** (from the project root directory):
     ```bash
     npm run dev
     ```
     This starts the Vite development server at `http://localhost:5173`. Any API calls will be automatically proxied to the Express backend.

4. **Access the App**:
   Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Default Accounts

When the database is created for the first time, it is pre-populated with a default admin user:
- **Email**: `admin@kisanmitra.local`
- **Password**: `admin123`

You can register new farmer accounts directly through the registration page (instant access with JWT session).

---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI, Recharts, Lucide Icons, Leaflet
- **Backend**: Node.js, Express, Multer (local file storage)
- **Database**: Pure JS JSON Database (`backend/kisan_db.json`)
- **AI Service**: Google Gemini API (`@google/generative-ai`)
- **Authentication**: JWT (`jsonwebtoken` + `bcryptjs`)
