#!/bin/bash

# Automatic backup script for Enterprise CRM
# This script should be run via cron for automated backups

set -e

# Configuration
BACKUP_DIR="/var/backups/enterprise-crm"
RETENTION_DAYS=30
LOG_FILE="/var/log/enterprise-crm-backup.log"
APP_DIR="/var/www/enterprise-crm"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Logging function
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}$(date +'%Y-%m-%d %H:%M:%S') - ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Create backup directory
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

log "Starting automated backup..."

# Change to app directory
cd "$APP_DIR" || error "Cannot access application directory: $APP_DIR"

# Check if Docker Compose is running
if ! docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
    error "Docker containers are not running"
fi

# Create timestamped backup directory
TIMESTAMP=$(date +'%Y-%m-%d_%H-%M-%S')
CURRENT_BACKUP_DIR="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$CURRENT_BACKUP_DIR"

log "Creating backup in: $CURRENT_BACKUP_DIR"

# Load environment variables
if [ -f ".env.dev" ]; then
    export $(cat .env.dev | grep -v '^#' | xargs)
else
    error ".env.dev file not found"
fi

# Backup PostgreSQL database
log "Backing up PostgreSQL database..."
docker-compose -f docker-compose.dev.yml exec -T postgres pg_dump \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${POSTGRES_DB:-enterprise_crm}" \
    --clean --if-exists \
    --no-owner --no-privileges > "$CURRENT_BACKUP_DIR/database.sql" || error "Database backup failed"

# Backup OCR uploads
log "Backing up OCR uploads..."
if docker volume inspect enterprise_ocr_dev_uploads >/dev/null 2>&1; then
    docker run --rm \
        -v enterprise_ocr_dev_uploads:/data \
        -v "$CURRENT_BACKUP_DIR":/backup \
        alpine tar czf /backup/ocr_uploads.tar.gz -C /data . || log "WARNING: OCR uploads backup failed"
fi

# Backup pgAdmin data
log "Backing up pgAdmin configuration..."
if docker volume inspect enterprise_pgadmin_data >/dev/null 2>&1; then
    docker run --rm \
        -v enterprise_pgadmin_data:/data \
        -v "$CURRENT_BACKUP_DIR":/backup \
        alpine tar czf /backup/pgadmin_data.tar.gz -C /data . || log "WARNING: pgAdmin backup failed"
fi

# Backup Grafana data
log "Backing up Grafana dashboards..."
if docker volume inspect enterprise_grafana_data >/dev/null 2>&1; then
    docker run --rm \
        -v enterprise_grafana_data:/data \
        -v "$CURRENT_BACKUP_DIR":/backup \
        alpine tar czf /backup/grafana_data.tar.gz -C /data . || log "WARNING: Grafana backup failed"
fi

# Backup configuration files
log "Backing up configuration files..."
cp -r monitoring "$CURRENT_BACKUP_DIR/" 2>/dev/null || log "WARNING: Monitoring config backup failed"
cp -r nginx "$CURRENT_BACKUP_DIR/" 2>/dev/null || log "WARNING: Nginx config backup failed"
cp -r pgadmin "$CURRENT_BACKUP_DIR/" 2>/dev/null || log "WARNING: pgAdmin config backup failed"
cp .env.dev "$CURRENT_BACKUP_DIR/" 2>/dev/null || log "WARNING: Environment file backup failed"
cp docker-compose.dev.yml "$CURRENT_BACKUP_DIR/" 2>/dev/null || log "WARNING: Docker compose backup failed"

# Create backup metadata
cat > "$CURRENT_BACKUP_DIR/backup_info.txt" << EOF
Backup created: $(date)
Backup type: Automated
Database: ${POSTGRES_DB:-enterprise_crm}
Database user: ${POSTGRES_USER:-postgres}
Application directory: $APP_DIR
Git commit: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Docker images:
$(docker-compose -f docker-compose.dev.yml images 2>/dev/null || echo "unknown")
System info:
$(uname -a)
Disk usage:
$(df -h)
EOF

# Create compressed archive
log "Compressing backup..."
cd "$BACKUP_DIR"
tar czf "backup_$TIMESTAMP.tar.gz" "$TIMESTAMP" || error "Failed to compress backup"
rm -rf "$TIMESTAMP"

# Cleanup old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete || log "WARNING: Old backup cleanup failed"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" | cut -f1)

log "Backup completed successfully!"
log "Backup file: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
log "Backup size: $BACKUP_SIZE"

# Optional: Send notification (you can add email/slack notification here)
# Example: curl -X POST "your-webhook-url" -d "Backup completed: backup_$TIMESTAMP.tar.gz ($BACKUP_SIZE)"

# Check disk space
DISK_USAGE=$(df "$BACKUP_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "WARNING: Backup disk usage is high: ${DISK_USAGE}%"
fi

log "Backup process finished"