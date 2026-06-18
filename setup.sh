#!/usr/bin/env bash
# ============================================================
#  MediSelf — one-shot build & setup script
#  Run once on the server after copying the project and
#  creating backend/.env  (see backend/.env.example).
# ============================================================
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
echo "==> MediSelf setup in: $ROOT"

# --- 1. Python backend: virtualenv + dependencies ---
echo ""
echo "==> [1/3] Backend: creating virtualenv and installing dependencies"
cd "$ROOT/backend"
if [ ! -d "venv" ]; then
  python3 -m venv venv
fi
./venv/bin/pip install --upgrade pip >/dev/null
./venv/bin/pip install -r requirements.txt
echo "    backend deps installed."

# --- 2. .env check ---
echo ""
echo "==> [2/3] Checking backend/.env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "    Created backend/.env from .env.example."
  echo "    >> IMPORTANT: edit backend/.env to set PORT, JWT secrets, and"
  echo "       (optionally) SMTP + DEEPSEEK keys before going live."
else
  echo "    backend/.env already exists — leaving it untouched."
fi

# --- 3. Frontend: install + build ---
echo ""
echo "==> [3/3] Frontend: installing and building the React SPA"
cd "$ROOT/frontend"
npm install
npm run build
echo "    frontend built to frontend/dist."

mkdir -p "$ROOT/logs"

echo ""
echo "============================================================"
echo " Setup complete!"
echo ""
echo " Start with PM2:"
echo "     pm2 start ecosystem.config.js"
echo "     pm2 save"
echo ""
echo " Or run directly:"
echo "     ./start.sh"
echo ""
echo " The app (API + web UI) will be served on the PORT in backend/.env"
echo "============================================================"
