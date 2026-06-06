#!/bin/sh
set -e

WORKERS="${UVICORN_WORKERS:-1}"

uvicorn backend.app:app --host 0.0.0.0 --port 8000 --workers "$WORKERS" &
python bot/bot.py &
wait -n
exit $?
