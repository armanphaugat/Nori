# Nori Discord Bot

RAG-powered Discord support bot with an admin dashboard. Uses Graphlit for knowledge-base ingest/query, Supabase Postgres for metadata, and Redis for API key rotation.

## Quick start (local)

1. Copy `.env.example` to `.env` and fill in values.
2. Apply database schema from `dbstruct.txt` in Supabase.
3. Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`
4. Run API: `uvicorn backend.app:app --reload --port 8000`
5. Run bot: `python bot/bot.py`
6. Run dashboard: `cd frontend && npm install && npm run dev`

## Production (Oracle Cloud)

See [DEPLOY.md](DEPLOY.md) for the full Oracle Always Free deployment guide.

```bash
docker compose build
docker compose up -d
```

## Stack

| Service | Role |
|---------|------|
| backend | FastAPI API + Discord bot (single container) |
| frontend | React dashboard (nginx, proxies `/api`) |
| redis | Key rotation cache |
| bullmq | Rotates Groq/Tavily/Exa keys every 5 min |
