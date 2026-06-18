#!/usr/bin/env bash
# Starts the MediSelf backend (FastAPI + uvicorn).
# Reads PORT (and all other settings) from backend/.env.
set -e

cd "$(dirname "$0")/backend"

# Load .env so PORT is available to this script.
if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi

PORT="${PORT:-3000}"

# Prefer the project virtualenv if present.
if [ -x "./venv/bin/uvicorn" ]; then
  UVICORN="./venv/bin/uvicorn"
else
  UVICORN="uvicorn"
fi

echo "Starting MediSelf on port ${PORT}..."
exec "$UVICORN" app.main:app --host 0.0.0.0 --port "${PORT}"
