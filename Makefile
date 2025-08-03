# CRM System Makefile with Docker Buildkit Workaround

# Environment setup
.PHONY: setup
setup:
	@echo "🔧 Setting up CRM system..."
	@cp .env.example .env 2>/dev/null || echo ".env already exists"
	@echo "✅ Environment setup complete"

# Docker commands with proper buildkit settings
.PHONY: build
build:
	@echo "🏗️ Building all services with legacy Docker builder..."
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose build

.PHONY: build-ocr
build-ocr:
	@echo "🏗️ Building OCR service with legacy Docker builder..."
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose build ocr-service

.PHONY: up
up:
	@echo "🚀 Starting all services..."
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose up -d

.PHONY: up-core
up-core:
	@echo "🚀 Starting core services (no OCR)..."
	docker-compose up -d postgres redis api-gateway frontend

.PHONY: up-ocr
up-ocr: build-ocr
	@echo "🚀 Starting OCR service..."
	docker-compose up -d ocr-service

.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: logs-ocr
logs-ocr:
	docker-compose logs -f ocr-service

.PHONY: down
down:
	@echo "🛑 Stopping all services..."
	docker-compose down

.PHONY: clean
clean:
	@echo "🧹 Cleaning Docker resources..."
	docker-compose down -v
	docker system prune -f

.PHONY: status
status:
	@echo "📊 Service status:"
	docker-compose ps

.PHONY: test-ocr
test-ocr:
	@echo "🧪 Testing OCR service..."
	@curl -f http://localhost:8000/health || echo "❌ OCR service not responding"
	@curl -f http://localhost:3000/api/health || echo "❌ API Gateway not responding"

# Development helpers
.PHONY: shell-ocr
shell-ocr:
	docker-compose exec ocr-service /bin/bash

.PHONY: restart-ocr
restart-ocr:
	docker-compose restart ocr-service

.PHONY: rebuild-ocr
rebuild-ocr: 
	@echo "🔄 Rebuilding OCR service from scratch..."
	docker-compose down ocr-service
	DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker-compose build --no-cache ocr-service
	@echo "✅ OCR service rebuilt successfully"
	@echo "⚠️  Remember to run 'make up-ocr-safe' to start with new image"

.PHONY: up-ocr-safe
up-ocr-safe:
	@echo "🚀 Starting OCR service with latest image..."
	@docker images | grep enterprise-ocr-service
	docker-compose up -d ocr-service

# Help
.PHONY: help
help:
	@echo "🆘 Available commands:"
	@echo "  setup      - Initial environment setup"
	@echo "  build      - Build all services"
	@echo "  build-ocr  - Build OCR service only"
	@echo "  up         - Start all services"
	@echo "  up-core    - Start core services (no OCR)"
	@echo "  up-ocr     - Build and start OCR service"
	@echo "  logs       - Show all service logs"
	@echo "  logs-ocr   - Show OCR service logs"
	@echo "  down       - Stop all services"
	@echo "  clean      - Stop and clean Docker resources"
	@echo "  status     - Show service status"
	@echo "  test-ocr   - Test OCR endpoints"
	@echo "  shell-ocr  - Open shell in OCR container"
	@echo "  restart-ocr    - Restart OCR service"
	@echo "  rebuild-ocr    - Rebuild OCR from scratch"