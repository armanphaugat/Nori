# Nori — Oracle Cloud Production Deployment

## Architecture

```
Internet → Cloudflare (HTTPS) → Oracle VM :80
                                    └── Docker Compose
                                          ├── frontend (nginx, /api → backend)
                                          ├── backend (FastAPI + Discord bot)
                                          ├── bullmq (API key rotation)
                                          └── redis
                                    └── Supabase Postgres (external)
                                    └── Graphlit / Groq / Tavily / Exa (external)
```

## Prerequisites

- Oracle Cloud account (Always Free **Ampere A1**: 4 OCPU, 24 GB RAM)
- Domain name (recommended; Cloudflare free tier works)
- Supabase Postgres with schema from `dbstruct.txt`
- Discord application (OAuth + bot)
- Graphlit, Groq, Tavily, Exa API keys

## 1. Create Oracle VM

| Setting | Value |
|---------|--------|
| Image | Ubuntu 22.04 (Always Free eligible) |
| Shape | VM.Standard.A1.Flex |
| OCPUs / RAM | 4 / 24 GB |
| Boot volume | 50–100 GB |
| Public IP | Assign |

### Open ports (OCI Console → VCN → Security List)

| Port | Source | Purpose |
|------|--------|---------|
| 22 | Your IP | SSH |
| 80 | 0.0.0.0/0 | HTTP |
| 443 | 0.0.0.0/0 | HTTPS (optional if using Cloudflare) |

**Do not** expose 6379 or 8000 publicly.

### On the VM (Oracle iptables)

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

Or run: `bash scripts/oracle-firewall.sh`

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker
```

## 3. Configure environment

```bash
git clone <your-repo-url> nori
cd nori
cp .env.example .env
nano .env
```

**Production values (required changes):**

```env
ENV=production
FRONTEND_URL=https://nori.dev
DISCORD_REDIRECT_URI=https://nori.dev/api/auth/discord/callback
REDIS_HOST=redis
REDIS_PORT=6379
```

Set `DISCORD_BOT_KEY` and `DISCORD_BOT_TOKEN` to the **same** bot token.

Add the same `DISCORD_REDIRECT_URI` in the [Discord Developer Portal](https://discord.com/developers/applications) → OAuth2 → Redirects.

## 4. Deploy

```bash
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend
```

### Health checks

```bash
curl http://localhost/           # frontend
curl http://localhost/api/       # backend via nginx
```

## 5. Domain & HTTPS

**Recommended:** Cloudflare

1. Add an A record pointing to the Oracle VM public IP.
2. Enable proxy (orange cloud).
3. SSL/TLS mode: **Full**.

The frontend is built with `VITE_API_URL=/api` so API calls stay same-origin through nginx.

## 6. Discord checklist

- [ ] OAuth redirect URL matches `DISCORD_REDIRECT_URI`
- [ ] Bot token in `DISCORD_BOT_KEY` and `DISCORD_BOT_TOKEN`
- [ ] Required bot intents enabled in Developer Portal
- [ ] Bot invited to test servers

## 7. Operations

```bash
# View logs
docker compose logs -f backend
docker compose logs -f bullmq

# Restart after .env change
docker compose up -d --build

# Stop
docker compose down
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Site unreachable | Check OCI security list **and** VM iptables |
| OAuth redirect mismatch | `DISCORD_REDIRECT_URI` must be `https://nori.dev/api/auth/discord/callback` |
| Graphlit errors | Set both `GRAPHLIT_ORGANIZATION_ID` and `GRAPHLIT_ORGANIZATION_KEY` |
| Redis connection failed | Ensure `REDIS_HOST=redis` in `.env` |
| Backend OOM on 24 GB VM | Already set `UVICORN_WORKERS=1`; reduce concurrent uploads |

## Local development (without Docker)

```bash
# Terminal 1 — Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2 — API
uvicorn backend.app:app --reload --port 8000

# Terminal 3 — Bot
python bot/bot.py

# Terminal 4 — Frontend
cd frontend && npm install && npm run dev
```
