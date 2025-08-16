#!/bin/bash

# Monitoring System Installation Script
# Sets up automated monitoring for Enterprise CRM production system

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/var/www/enterprise"
MONITORING_USER="root"  # User to run monitoring scripts
CRON_USER="root"       # User for cron jobs

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_status "$RED" "This script must be run as root for system monitoring setup"
        exit 1
    fi
}

# Install required system packages
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Update package list
    print_status "$YELLOW" "Updating package list..."
    apt-get update -qq
    
    # Install required packages
    local packages=(
        "curl"
        "jq"
        "bc"
        "sysstat"
        "mailutils"  # For email alerts (optional)
        "certbot"    # For SSL certificate management
    )
    
    for package in "${packages[@]}"; do
        if dpkg -l | grep -q "^ii  $package "; then
            print_status "$GREEN" "✓ $package already installed"
        else
            print_status "$YELLOW" "Installing $package..."
            apt-get install -y "$package" >/dev/null 2>&1
            print_status "$GREEN" "✓ $package installed"
        fi
    done
}

# Set up monitoring directories and permissions
setup_directories() {
    print_header "Setting Up Directories"
    
    local directories=(
        "/var/log"
        "/var/backups/enterprise-crm"
        "/etc/monitoring"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            print_status "$GREEN" "✓ Created directory: $dir"
        else
            print_status "$GREEN" "✓ Directory exists: $dir"
        fi
    done
    
    # Set proper permissions
    chmod 755 /var/log
    chmod 755 /var/backups/enterprise-crm
    chmod 755 /etc/monitoring
    
    print_status "$GREEN" "✓ Directory permissions set"
}

# Make monitoring scripts executable
setup_scripts() {
    print_header "Setting Up Monitoring Scripts"
    
    local scripts=(
        "ssl-monitor.sh"
        "container-health-monitor.sh"  
        "infrastructure-monitor.sh"
        "system-monitor.sh"
        "alert-manager.sh"
    )
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        
        if [[ -f "$script_path" ]]; then
            chmod +x "$script_path"
            print_status "$GREEN" "✓ Made $script executable"
        else
            print_status "$RED" "✗ Script not found: $script_path"
            exit 1
        fi
    done
    
    # Create symbolic links in /usr/local/bin for easy access
    local bin_links=(
        "enterprise-monitor:system-monitor.sh"
        "enterprise-ssl-check:ssl-monitor.sh"
        "enterprise-health-check:container-health-monitor.sh"
        "enterprise-infra-check:infrastructure-monitor.sh"
        "enterprise-alerts:alert-manager.sh"
    )
    
    for link_info in "${bin_links[@]}"; do
        local link_name="${link_info%:*}"
        local script_name="${link_info#*:}"
        local target_path="$SCRIPT_DIR/$script_name"
        local link_path="/usr/local/bin/$link_name"
        
        if [[ -L "$link_path" ]]; then
            rm "$link_path"
        fi
        
        ln -s "$target_path" "$link_path"
        print_status "$GREEN" "✓ Created symlink: $link_name -> $script_name"
    done
}

# Set up cron jobs for automated monitoring
setup_cron_jobs() {
    print_header "Setting Up Cron Jobs"
    
    # Create monitoring cron file
    local cron_file="/etc/cron.d/enterprise-monitoring"
    
    cat > "$cron_file" << 'EOF'
# Enterprise CRM Monitoring Cron Jobs
# Generated automatically - DO NOT EDIT MANUALLY

SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
MAILTO=""

# Full system monitoring every 5 minutes
*/5 * * * * root /var/www/enterprise/monitoring/system-monitor.sh full >> /var/log/cron-monitoring.log 2>&1

# SSL certificate check every 6 hours
0 */6 * * * root /var/www/enterprise/monitoring/ssl-monitor.sh >> /var/log/cron-monitoring.log 2>&1

# Container health check every 2 minutes
*/2 * * * * root /var/www/enterprise/monitoring/container-health-monitor.sh >> /var/log/cron-monitoring.log 2>&1

# Infrastructure check every 10 minutes
*/10 * * * * root /var/www/enterprise/monitoring/infrastructure-monitor.sh >> /var/log/cron-monitoring.log 2>&1

# Alert manager processing every 3 minutes
*/3 * * * * root /var/www/enterprise/monitoring/alert-manager.sh monitor >> /var/log/cron-monitoring.log 2>&1

# Daily recovery report at 6 AM
0 6 * * * root /var/www/enterprise/monitoring/alert-manager.sh report > /var/log/daily-recovery-report.log 2>&1

# Weekly cleanup of old logs (every Sunday at 2 AM)
0 2 * * 0 root find /var/log -name "*.log" -mtime +30 -delete 2>/dev/null

# Monthly system health summary report (1st of month at 9 AM)
0 9 1 * * root /var/www/enterprise/monitoring/system-monitor.sh status > /var/log/monthly-health-report.log 2>&1
EOF
    
    # Set proper permissions
    chmod 644 "$cron_file"
    chown root:root "$cron_file"
    
    print_status "$GREEN" "✓ Cron jobs configured in $cron_file"
    
    # Restart cron service to pick up new jobs
    systemctl restart cron
    print_status "$GREEN" "✓ Cron service restarted"
}

# Create monitoring configuration file
create_config() {
    print_header "Creating Configuration"
    
    local config_file="/etc/monitoring/enterprise-monitoring.conf"
    
    cat > "$config_file" << EOF
# Enterprise CRM Monitoring Configuration
# Edit this file to customize monitoring settings

# Domain to monitor
DOMAIN="cactoos.digital"

# Alert thresholds
SSL_ALERT_DAYS=30
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85

# Notification settings (configure these for alerts)
ALERT_EMAIL=""
WEBHOOK_URL=""

# Database settings
POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="enterprise_crm"
POSTGRES_USER="postgres"

# API response time threshold (milliseconds)
API_RESPONSE_THRESHOLD=5000

# Nginx error threshold (errors per 10 minutes)
NGINX_ERROR_THRESHOLD=10

# Recovery settings
MAX_CONTAINER_RESTARTS=3
MAX_SERVICE_RESTARTS=2
RECOVERY_COOLDOWN=300

# Log retention (days)
LOG_RETENTION_DAYS=30
EOF
    
    chmod 644 "$config_file"
    print_status "$GREEN" "✓ Configuration created at $config_file"
}

# Set up log rotation
setup_log_rotation() {
    print_header "Setting Up Log Rotation"
    
    local logrotate_file="/etc/logrotate.d/enterprise-monitoring"
    
    cat > "$logrotate_file" << 'EOF'
/var/log/ssl-monitor.log
/var/log/container-health.log
/var/log/infrastructure-monitor.log
/var/log/system-monitor.log
/var/log/alert-manager.log
/var/log/recovery-actions.log
/var/log/cron-monitoring.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
    postrotate
        # No need to restart services for monitoring logs
    endscript
}
EOF
    
    chmod 644 "$logrotate_file"
    print_status "$GREEN" "✓ Log rotation configured"
}

# Create systemd service for monitoring (optional)
create_systemd_service() {
    print_header "Creating Systemd Service"
    
    local service_file="/etc/systemd/system/enterprise-monitoring.service"
    
    cat > "$service_file" << EOF
[Unit]
Description=Enterprise CRM Monitoring Service
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
ExecStart=/var/www/enterprise/monitoring/system-monitor.sh full
User=root
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
    
    local timer_file="/etc/systemd/system/enterprise-monitoring.timer"
    
    cat > "$timer_file" << 'EOF'
[Unit]
Description=Run Enterprise CRM Monitoring every 5 minutes
Requires=enterprise-monitoring.service

[Timer]
OnCalendar=*:0/5
Persistent=true

[Install]
WantedBy=timers.target
EOF
    
    # Reload systemd and enable timer (but don't start it - we're using cron)
    systemctl daemon-reload
    
    print_status "$GREEN" "✓ Systemd service created (using cron for scheduling)"
}

# Test monitoring setup
test_monitoring() {
    print_header "Testing Monitoring Setup"
    
    # Test SSL monitoring
    print_status "$YELLOW" "Testing SSL monitoring..."
    if "$SCRIPT_DIR/ssl-monitor.sh" >/dev/null 2>&1; then
        print_status "$GREEN" "✓ SSL monitoring test passed"
    else
        print_status "$RED" "✗ SSL monitoring test failed"
    fi
    
    # Test container health monitoring
    print_status "$YELLOW" "Testing container health monitoring..."
    if "$SCRIPT_DIR/container-health-monitor.sh" >/dev/null 2>&1; then
        print_status "$GREEN" "✓ Container health monitoring test passed"
    else
        print_status "$RED" "✗ Container health monitoring test failed"
    fi
    
    # Test infrastructure monitoring
    print_status "$YELLOW" "Testing infrastructure monitoring..."
    if "$SCRIPT_DIR/infrastructure-monitor.sh" >/dev/null 2>&1; then
        print_status "$GREEN" "✓ Infrastructure monitoring test passed"
    else
        print_status "$RED" "✗ Infrastructure monitoring test failed"
    fi
    
    # Test system monitoring with quick check
    print_status "$YELLOW" "Testing system monitoring..."
    if "$SCRIPT_DIR/system-monitor.sh" quick >/dev/null 2>&1; then
        print_status "$GREEN" "✓ System monitoring test passed"
    else
        print_status "$RED" "✗ System monitoring test failed"
    fi
    
    # Test alert manager
    print_status "$YELLOW" "Testing alert manager..."
    if "$SCRIPT_DIR/alert-manager.sh" test >/dev/null 2>&1; then
        print_status "$GREEN" "✓ Alert manager test passed"
    else
        print_status "$RED" "✗ Alert manager test failed"
    fi
}

# Display final instructions
show_final_instructions() {
    print_header "Installation Complete"
    
    cat << 'EOF'

🎉 Enterprise CRM Monitoring System has been successfully installed!

QUICK START:
  enterprise-monitor status    - Check current system status
  enterprise-monitor quick     - Quick health check
  enterprise-monitor full      - Full monitoring run

MONITORING COMMANDS:
  enterprise-ssl-check         - Check SSL certificate status
  enterprise-health-check      - Check container health
  enterprise-infra-check       - Check infrastructure
  enterprise-alerts test       - Send test alert

LOGS:
  /var/log/system-monitor.log      - Main monitoring log
  /var/log/ssl-monitor.log         - SSL monitoring log
  /var/log/container-health.log    - Container health log
  /var/log/infrastructure-monitor.log - Infrastructure log
  /var/log/alert-manager.log       - Alert manager log
  /var/log/recovery-actions.log    - Recovery actions log

CONFIGURATION:
  /etc/monitoring/enterprise-monitoring.conf - Main configuration file

AUTOMATED MONITORING:
  ✓ Full monitoring every 5 minutes
  ✓ SSL checks every 6 hours  
  ✓ Container health every 2 minutes
  ✓ Infrastructure checks every 10 minutes
  ✓ Alert processing every 3 minutes
  ✓ Daily recovery reports at 6 AM

NEXT STEPS:
1. Edit /etc/monitoring/enterprise-monitoring.conf to configure alerts
2. Set ALERT_EMAIL and/or WEBHOOK_URL for notifications
3. Run 'enterprise-monitor status' to see current system health
4. Check /var/log/cron-monitoring.log for automated monitoring

For support: Check logs in /var/log/ for any issues.

EOF

    print_status "$GREEN" "Monitoring system is now active and protecting your Enterprise CRM!"
}

# Main installation function
main() {
    print_header "Enterprise CRM Monitoring System Installation"
    
    # Pre-installation checks
    check_root
    
    # Installation steps
    install_dependencies
    setup_directories
    setup_scripts
    setup_cron_jobs
    create_config
    setup_log_rotation
    create_systemd_service
    
    # Test installation
    test_monitoring
    
    # Show completion message
    show_final_instructions
    
    print_status "$GREEN" "\n✅ Installation completed successfully!"
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi