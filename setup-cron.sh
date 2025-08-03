#!/bin/bash

# Setup cron jobs for Enterprise CRM maintenance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Get the current directory (where the app is installed)
APP_DIR=$(pwd)

log "Setting up cron jobs for Enterprise CRM..."
log "Application directory: $APP_DIR"

# Create cron jobs
CRON_FILE="/tmp/enterprise-crm-cron"

cat > "$CRON_FILE" << EOF
# Enterprise CRM Automated Tasks
# Generated on $(date)

# Daily backup at 2:00 AM
0 2 * * * cd $APP_DIR && ./auto-backup.sh >> /var/log/enterprise-crm-cron.log 2>&1

# Weekly log rotation on Sunday at 3:00 AM
0 3 * * 0 cd $APP_DIR && docker-compose -f docker-compose.dev.yml logs --tail=1000 > logs/docker-logs-\$(date +\%Y-\%m-\%d).log 2>&1

# Monthly container cleanup on 1st day at 4:00 AM
0 4 1 * * docker system prune -f >> /var/log/enterprise-crm-cron.log 2>&1

# Check disk space daily at 6:00 AM
0 6 * * * df -h >> /var/log/enterprise-crm-disk-usage.log 2>&1

# Restart services if they're down (every 30 minutes)
*/30 * * * * cd $APP_DIR && docker-compose -f docker-compose.dev.yml ps | grep -q "Exit" && docker-compose -f docker-compose.dev.yml restart >> /var/log/enterprise-crm-cron.log 2>&1 || true

EOF

# Install cron jobs
crontab "$CRON_FILE"
rm "$CRON_FILE"

log "Cron jobs installed successfully!"

info "Scheduled tasks:"
echo "  • Daily backup at 2:00 AM"
echo "  • Weekly log rotation on Sunday at 3:00 AM"
echo "  • Monthly Docker cleanup on 1st day at 4:00 AM"  
echo "  • Daily disk space check at 6:00 AM"
echo "  • Service health check every 30 minutes"

echo ""
info "Log files:"
echo "  • Backup logs: /var/log/enterprise-crm-backup.log"
echo "  • Cron logs: /var/log/enterprise-crm-cron.log"
echo "  • Disk usage: /var/log/enterprise-crm-disk-usage.log"
echo "  • Docker logs: $APP_DIR/logs/"

echo ""
info "Useful commands:"
echo "  • View current cron jobs: crontab -l"
echo "  • Edit cron jobs: crontab -e"
echo "  • View backup logs: tail -f /var/log/enterprise-crm-backup.log"
echo "  • Manual backup: $APP_DIR/auto-backup.sh"

# Create log directories
sudo mkdir -p /var/log
sudo mkdir -p "$APP_DIR/logs"
sudo chown $USER:$USER "$APP_DIR/logs"

# Test backup script permissions
if [ ! -x "$APP_DIR/auto-backup.sh" ]; then
    warn "Backup script is not executable. Fixing permissions..."
    chmod +x "$APP_DIR/auto-backup.sh"
fi

log "Cron setup completed! Your Enterprise CRM will now be automatically maintained."

# Show next backup time
NEXT_BACKUP=$(date -d "tomorrow 2:00" '+%Y-%m-%d %H:%M:%S')
info "Next scheduled backup: $NEXT_BACKUP"