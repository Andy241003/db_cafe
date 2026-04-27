#!/usr/bin/env bash
set -euo pipefail

echo "[prestart] Checking database connectivity..."
python - <<'PY'
from sqlalchemy import text
from app.core.db import engine

with engine.connect() as conn:
    conn.execute(text("SELECT 1"))

print("[prestart] Database connection OK")
PY

if [ "${RUN_ALEMBIC_MIGRATIONS:-false}" = "true" ]; then
  echo "[prestart] Running Alembic migrations..."
  alembic -c /app/alembic.ini upgrade head
else
  echo "[prestart] Skipping Alembic migrations (set RUN_ALEMBIC_MIGRATIONS=true to enable)."
fi

echo "[prestart] Seeding initial application data..."
python -m app.initial_data
echo "[prestart] Initial data ready"
