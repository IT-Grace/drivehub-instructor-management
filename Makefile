# DriveWise Docker Makefile

# Variables
IMAGE_NAME = drivewise-app
CONTAINER_NAME = drivewise-container
COMPOSE_FILE = docker-compose.yml
PROD_COMPOSE_FILE = docker-compose.prod.yml

# Default target
.PHONY: help
help:
	@echo "DriveWise Docker Commands:"
	@echo "  make build          - Build the Docker image"
	@echo "  make run            - Run the container"
	@echo "  make dev            - Start development environment"
	@echo "  make prod           - Start production environment"
	@echo "  make stop           - Stop all containers"
	@echo "  make clean          - Clean up containers and images"
	@echo "  make logs           - View application logs"
	@echo "  make shell          - Access container shell"
	@echo "  make health         - Check application health"
	@echo "  make db             - Access database shell"

# Build the Docker image
.PHONY: build
build:
	docker build -t $(IMAGE_NAME) .

# Run single container
.PHONY: run
run:
	docker run -d --name $(CONTAINER_NAME) -p 5000:5000 $(IMAGE_NAME)

# Development environment
.PHONY: dev
dev:
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "Development environment started. Access at http://localhost:5000"

# Production environment
.PHONY: prod
prod:
	docker-compose -f $(PROD_COMPOSE_FILE) up -d
	@echo "Production environment started. Access at http://localhost"

# Stop all containers
.PHONY: stop
stop:
	docker-compose -f $(COMPOSE_FILE) down
	docker-compose -f $(PROD_COMPOSE_FILE) down 2>/dev/null || true

# Clean up everything
.PHONY: clean
clean:
	docker-compose -f $(COMPOSE_FILE) down -v --rmi all
	docker-compose -f $(PROD_COMPOSE_FILE) down -v --rmi all 2>/dev/null || true
	docker system prune -f

# View logs
.PHONY: logs
logs:
	docker-compose -f $(COMPOSE_FILE) logs -f app

# Access container shell
.PHONY: shell
shell:
	docker-compose -f $(COMPOSE_FILE) exec app sh

# Check health
.PHONY: health
health:
	@curl -s http://localhost:5000/api/health | jq . || echo "Health check failed"

# Access database
.PHONY: db
db:
	docker-compose -f $(COMPOSE_FILE) exec postgres psql -U drivewise -d drivewise

# Rebuild and restart
.PHONY: restart
restart: stop build dev

# Update and restart production
.PHONY: deploy
deploy:
	git pull
	docker-compose -f $(PROD_COMPOSE_FILE) down
	docker build -t $(IMAGE_NAME) .
	docker-compose -f $(PROD_COMPOSE_FILE) up -d

# Database migrations
.PHONY: migrate
migrate:
	docker-compose -f $(COMPOSE_FILE) exec app npm run db:push