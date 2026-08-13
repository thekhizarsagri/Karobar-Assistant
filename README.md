# Karobar Assistant

An AI-powered Business Intelligence & Analytics Platform that helps businesses manage production, sales, inventory, expenses, forecasting, and AI-driven decision-making.

## Quick Start — How to Run

> You only need **one command** and **one browser tab**: `http://127.0.0.1:8000` runs the entire app (backend + frontend together).

**First time setup** (only needed once):

1. Install the Python backend: `pip install -r backend/requirements.txt`
2. Build the frontend once: `cd frontend && npm install && npm run build`

**Every time you want to run it:**

```bash
uvicorn backend.main:app --reload
```

Then open **http://127.0.0.1:8000** in Chrome.

- To stop: press `Ctrl+C` in the terminal.
- Every restart starts with **fresh demo data** (nothing is saved to disk). Refreshing the page does **not** lose your data while the server is running.
- If the port is busy because an old backend is still running, close it first: `taskkill /F /IM KarobarBackend.exe` (then run the command above again).

### First-time usage flow

1. On the welcome screen, click **Demo Mode**.
2. Fill the form (business info, products, expenses) and click **Finish Setup**.
3. You're on the dashboard: record sales, add stock, view analytics.
4. Avatar (top-right) → **Edit form** to change your products/business, **Start fresh** to wipe the demo, or **Logout** to go back to the welcome screen.

## Alternative: Frontend dev mode (hot reload)

Only needed if you are editing the frontend code and want live reload:

```bash
uvicorn backend.main:app --reload   # terminal 1 — API on :8000
cd frontend && npm run dev          # terminal 2 — app on http://localhost:5173
```

## Architecture

- **Backend** — Python FastAPI (`backend/`). Owns all business data (sales, stock, expenses) and serves the built frontend, so the whole site runs from one process.
- **Frontend** — React + Vite SPA (`frontend/`). Uses react-router (`/welcome`, `/setup`, `/dashboard`) so browser back/forward and refresh work normally.

## Tests

```bash
python -m pytest backend/tests      # backend
cd frontend && npm run lint          # frontend lint
cd frontend && npm run build         # frontend build
```