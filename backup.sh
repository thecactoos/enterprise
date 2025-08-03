#!/bin/bash

# Enterprise CRM Backup Script
# Backs up database and important files

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

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

# Load environment variables
if [ ! -f ".env.prod" ]; then
    error ".env.prod file not found"
fi

export $(cat .env.prod | grep -v '^#' | xargs)

# Create backup directory
BACKUP_DIR="backups/$(date +'%Y-%m-%d_%H-%M-%S')"
mkdir -p "$BACKUP_DIR"

log "Creating backup in $BACKUP_DIR"

# Backup database
log "Backing up PostgreSQL database..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-enterprise_crm}" \
    --clean --if-exists > "$BACKUP_DIR/database.sql"

# Backup OCR uploads
log "Backing up OCR uploads..."
if docker volume inspect enterprise_ocr_uploads >/dev/null 2>&1; then
    docker run --rm -v enterprise_ocr_uploads:/data -v "$(pwd)/$BACKUP_DIR":/backup alpine \
        tar czf /backup/ocr_uploads.tar.gz -C /data .
fi

# Backup SSL certificates
log "Backing up SSL certificates..."
if [ -d "ssl" ]; then
    cp -r ssl "$BACKUP_DIR/"
fi

# Backup environment files
log "Backing up configuration files..."
cp .env.prod "$BACKUP_DIR/"
cp -r nginx "$BACKUP_DIR/"

# Create backup info
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Database: ${POSTGRES_DB:-enterprise_crm}
Database user: ${POSTGRES_USER:-postgres}
Application version: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Docker images:
$(docker compose -f docker-compose.prod.yml images)
EOF

# Compress backup
log "Compressing backup..."
tar czf "backups/backup_$(date +'%Y-%m-%d_%H-%M-%S').tar.gz" -C backups "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"

# Cleanup old backups (keep last 7 days)
log "Cleaning up old backups..."
find backups -name "backup_*.tar.gz" -mtime +7 -delete

log "Backup completed successfully!"
echo "Backup file: backups/backup_$(date +'%Y-%m-%d_%H-%M-%S').tar.gz"