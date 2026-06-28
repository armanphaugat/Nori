#!/bin/bash
set -e

WORKERS="${UVICORN_WORKERS:-1}"

uvicorn backend.app:app --host 0.0.0.0 --port 12000 --workers "$WORKERS" &
UVICORN_PID=$!

python bot/bot.py &
BOT_PID=$!

# Exit when either process exits; kill the other first
wait -n $UVICORN_PID $BOT_PID
EXIT_CODE=$?

kill $UVICORN_PID $BOT_PID 2>/dev/null || true
exit $EXIT_CODE