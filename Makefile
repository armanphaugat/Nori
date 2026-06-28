COMPOSE = podman-compose

.PHONY: up down build logs logs-backend logs-bullmq restart deploy clean

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

logs-backend:
	podman logs -f nori-backend

logs-bullmq:
	podman logs -f nori-bullmq

restart:
	$(COMPOSE) restart

deploy:
	podman build -t nori-backend -f Dockerfile.backend .
	podman build -t nori-bullmq -f Dockerfile.bullmq .
	-podman stop nori-backend nori-bullmq 2>/dev/null
	-podman rm   nori-backend nori-bullmq 2>/dev/null
	podman network create nori-net 2>/dev/null || true
	podman run -d \
		--name nori-backend \
		--network nori-net \
		--add-host=host.docker.internal:host-gateway \
		--env-file .env \
		-e REDIS_HOST=host.docker.internal \
		-e REDIS_PORT=6379 \
		-e REDIS_USER=your_redis_username \
		-e REDIS_PASSWORD=your_redis_password \
		-p 12000:12000 \
		--restart=unless-stopped \
		nori-backend
	podman run -d \
		--name nori-bullmq \
		--network nori-net \
		--add-host=host.docker.internal:host-gateway \
		--env-file .env \
		-e REDIS_HOST=host.docker.internal \
		-e REDIS_PORT=6379 \
		-e REDIS_USER=your_redis_username \
		-e REDIS_PASSWORD=your_redis_password \
		--restart=unless-stopped \
		nori-bullmq

clean:
	-podman stop nori-backend nori-bullmq 2>/dev/null
	-podman rm   nori-backend nori-bullmq 2>/dev/null
	-podman rmi  nori-backend nori-bullmq 2>/dev/null
	-podman network rm nori-net 2>/dev/null