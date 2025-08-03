#!/bin/bash

# Enterprise CRM Deployment Script
# This script automates the deployment process for the production environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check if Docker and Docker Compose are installed
command -v docker >/dev/null 2>&1 || error "Docker is not installed"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    warn ".env.prod file not found"
    echo "Please copy .env.prod.example to .env.prod and configure your environment variables"
    echo "cp .env.prod.example .env.prod"
    echo "nano .env.prod"
    exit 1
fi

log "Starting Enterprise CRM deployment..."

# Create necessary directories
log "Creating required directories..."
mkdir -p ssl
mkdir -p logs
mkdir -p backups

# Check SSL certificates
if [ ! -f "ssl/cert.pem" ] || [ ! -f "ssl/private.key" ]; then
    warn "SSL certificates not found in ssl/ directory"
    echo "Please ensure you have:"
    echo "  - ssl/cert.pem (SSL certificate)"
    echo "  - ssl/private.key (Private key)"
    echo ""
    echo "For Let's Encrypt certificates, you can use:"
    echo "  sudo apt install certbot"
    echo "  sudo certbot certonly --standalone -d yourdomain.com"
    echo "  sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem"
    echo "  sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key"
    echo "  sudo chown \$(whoami):\$(whoami) ssl/*"
    exit 1
fi

# Load environment variables
log "Loading environment variables..."
export $(cat .env.prod | grep -v '^#' | xargs)

# Update domain in nginx config
log "Updating nginx configuration with your domain..."
if [ -n "$DOMAIN" ]; then
    sed -i "s/your-domain.com/$DOMAIN/g" nginx/conf.d/default.conf
    log "Domain updated to: $DOMAIN"
else
    warn "DOMAIN not set in .env.prod, using default configuration"
fi

# Pull latest images (if using registry)
log "Pulling latest Docker images..."
# docker compose -f docker-compose.prod.yml pull

# Build images
log "Building Docker images..."
export DOCKER_BUILDKIT=0  # Use legacy builder for compatibility
docker compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
log "Stopping existing containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans

# Start services
log "Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
log "Waiting for services to be healthy..."
sleep 30

# Check service health
log "Checking service health..."
services=("postgres" "services-service" "quotes-service" "ocr-service" "api-gateway")

for service in "${services[@]}"; do
    if docker compose -f docker-compose.prod.yml ps | grep -q "$service.*Up.*healthy\|$service.*Up"; then
        log "✓ $service is running"
    else
        error "✗ $service is not healthy"
    fi
done

# Check nginx
if docker compose -f docker-compose.prod.yml ps | grep -q "nginx.*Up"; then
    log "✓ Nginx is running"
else
    error "✗ Nginx is not running"
fi

# Display deployment information
log "Deployment completed successfully!"
echo ""
echo "=== DEPLOYMENT SUMMARY ==="
echo "Application URL: https://${DOMAIN:-your-domain.com}"
echo "Services running:"
docker compose -f docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "=== USEFUL COMMANDS ==="
echo "View logs: docker compose -f docker-compose.prod.yml logs -f [service_name]"
echo "Restart service: docker compose -f docker-compose.prod.yml restart [service_name]"
echo "Stop all: docker compose -f docker-compose.prod.yml down"
echo "Update app: ./deploy.sh"
echo ""
echo "=== MONITORING ==="
echo "Check application health: curl -k https://${DOMAIN:-your-domain.com}/api/health"
echo "View nginx logs: docker compose -f docker-compose.prod.yml logs nginx"
echo ""

log "Deployment completed! Your application should be available at https://${DOMAIN:-your-domain.com}"