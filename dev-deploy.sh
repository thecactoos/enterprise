#!/bin/bash

# Enterprise CRM Development Deployment Script
# This script sets up the development environment with pgAdmin

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if .env.dev exists
if [ ! -f ".env.dev" ]; then
    warn ".env.dev file not found"
    log "Creating .env.dev from template..."
    cp .env.dev.example .env.dev
    warn "Please review and update .env.dev if needed"
fi

log "Starting Enterprise CRM Development Environment..."

# Create necessary directories
log "Creating required directories..."
mkdir -p logs pgadmin

# Use legacy Docker builder for compatibility
export DOCKER_BUILDKIT=0

# Load environment variables
log "Loading development environment variables..."
export $(cat .env.dev | grep -v '^#' | xargs)

# Stop existing containers
log "Stopping existing containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans

# Build and start services
log "Building and starting development services..."
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
log "Waiting for services to start..."
sleep 30

# Check service health
log "Checking service health..."
services=("postgres" "services-service" "quotes-service" "ocr-service" "api-gateway")

for service in "${services[@]}"; do
    if docker-compose -f docker-compose.dev.yml ps | grep -q "$service.*Up.*healthy\|$service.*Up"; then
        log "✓ $service is running"
    else
        warn "⚠ $service might be starting..."
    fi
done

# Check pgAdmin
if docker-compose -f docker-compose.dev.yml ps | grep -q "pgadmin.*Up"; then
    log "✓ pgAdmin is running"
else
    warn "⚠ pgAdmin might be starting..."
fi

log "Development environment deployed successfully!"
echo ""
echo "=== DEVELOPMENT SERVICES ==="
echo "🌐 API Gateway:     http://localhost:3000"
echo "🗄️  pgAdmin:        http://localhost:5050"
echo "   ├─ Email:        admin@enterprise.local"
echo "   └─ Password:     devpassword123"
echo "🐘 PostgreSQL:      localhost:5432"
echo "   ├─ Database:     enterprise_crm"
echo "   ├─ User:         postgres"
echo "   └─ Password:     devpassword123"
echo "🔍 OCR Service:     http://localhost:8000"
echo "⚙️  Services API:    http://localhost:3001"
echo "💰 Quotes API:      http://localhost:3002"
echo "📦 Redis:           localhost:6379"
echo "🐳 Portainer:       http://localhost:9000 (HTTPS: 9443)"
echo "📊 Grafana:         http://localhost:3010"
echo "   ├─ User:         admin"
echo "   └─ Password:     devpassword123"
echo "📈 Prometheus:      http://localhost:9090"
echo "🖥️  Node Exporter:   http://localhost:9100"
echo "⏰ Uptime Kuma:     http://localhost:3011"
echo "🔴 Redis Insight:   http://localhost:8001"
echo ""
echo "=== USEFUL COMMANDS ==="
echo "View all logs:       docker-compose -f docker-compose.dev.yml logs -f"
echo "View service logs:   docker-compose -f docker-compose.dev.yml logs -f [service_name]"
echo "Restart service:     docker-compose -f docker-compose.dev.yml restart [service_name]"
echo "Stop all:           docker-compose -f docker-compose.dev.yml down"
echo "Rebuild service:     docker-compose -f docker-compose.dev.yml build --no-cache [service_name]"
echo ""
echo "=== FRONTEND DEVELOPMENT ==="
echo "Run frontend locally:"
echo "  cd frontend"
echo "  npm install"
echo "  npm start"
echo "  Frontend will be available at: http://localhost:3000"
echo ""
echo "Make sure to set in frontend/.env:"
echo "  REACT_APP_API_BASE_URL=http://localhost:3000"
echo ""

# Test database connection
log "Testing database connection..."
if docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    log "✓ Database is ready"
else
    warn "⚠ Database might still be initializing..."
fi

log "🎉 Development environment is ready!"
log "Access pgAdmin at http://localhost:5050 to manage your database"