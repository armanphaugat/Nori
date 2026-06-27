#!/bin/bash
set -e

WORKERS="${UVICORN_WORKERS:-1}"

uvicorn backend.app:app --host 0.0.0.0 --port 8000 --workers "$WORKERS" &
UVICORN_PID=$!

python bot/bot.py &
BOT_PID=$!

# Wait for either process to exit, then kill the other and exit with its code
wait $UVICORN_PID
UVICORN_EXIT=$?

kill $BOT_PID 2>/dev/null
exit $UVICORN_EXIT