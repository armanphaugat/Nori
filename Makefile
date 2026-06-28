COMPOSE = podman compose

.PHONY: up down build logs restart deploy

up:
        $(COMPOSE) up -d --build

down:
        $(COMPOSE) down

logs:
        $(COMPOSE) logs -f

deploy:
        podman build -t nori -f Dockerfile.backend .
        podman build -t nori-bullmq -f Dockerfile.bullmq .
        -podman stop nori nori-bullmq 2>/dev/null
        -podman rm nori nori-bullmq 2>/dev/null
        podman run -d \
                --name nori \
                --add-host=host.docker.internal:host-gateway \
                --env-file .env \
                -p 12000:12000 \
                --restart=unless-stopped \
                nori
        podman run -d \
                --name nori-bullmq \
                --add-host=host.docker.internal:host-gateway \
                --env-file .env \
                --restart=unless-stopped \
                nori-bullmq
