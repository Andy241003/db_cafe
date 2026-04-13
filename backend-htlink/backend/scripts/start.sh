#!/usr/bin/env bash
set -euo pipefail

bash /app/scripts/prestart.sh

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
