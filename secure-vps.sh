#!/bin/bash

# VPS Security Hardening Script for Enterprise CRM
# This script configures basic security measures

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
fi

log "Starting VPS security hardening..."

# Update system
log "Updating system packages..."
apt update && apt upgrade -y

# Install essential security tools
log "Installing security tools..."
apt install -y ufw fail2ban unattended-upgrades apt-listchanges

# Configure firewall
log "Configuring UFW firewall..."

# Reset firewall to defaults
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (current session)
CURRENT_SSH_PORT=$(ss -tlnp | grep sshd | awk '{print $4}' | cut -d: -f2 | head -1)
if [ -n "$CURRENT_SSH_PORT" ]; then
    ufw allow "$CURRENT_SSH_PORT"/tcp comment "SSH"
    log "Allowed SSH on port $CURRENT_SSH_PORT"
else
    ufw allow 22/tcp comment "SSH (default)"
    log "Allowed SSH on default port 22"
fi

# Allow application ports
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw allow 5432/tcp comment "PostgreSQL"
ufw allow 5050/tcp comment "pgAdmin"
ufw allow 9000/tcp comment "Portainer"
ufw allow 9443/tcp comment "Portainer HTTPS"
ufw allow 3000/tcp comment "API Gateway"
ufw allow 3010/tcp comment "Grafana"
ufw allow 9090/tcp comment "Prometheus"
ufw allow 8000/tcp comment "OCR Service"
ufw allow 3001/tcp comment "Services API"
ufw allow 3002/tcp comment "Quotes API"
ufw allow 6379/tcp comment "Redis"

# Enable firewall
ufw --force enable

log "Firewall configured and enabled"

# Configure Fail2Ban
log "Configuring Fail2Ban..."

# Create custom jail for SSH
cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
# Ban hosts for 1 hour
bantime = 3600

# Host is banned after 3 attempts
maxretry = 3

# Find time window (10 minutes)
findtime = 600

# Ignore local IPs
ignoreip = 127.0.0.1/8 ::1

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

# Start and enable Fail2Ban
systemctl enable fail2ban
systemctl restart fail2ban

log "Fail2Ban configured and started"

# Configure automatic security updates
log "Configuring automatic security updates..."

cat > /etc/apt/apt.conf.d/50unattended-upgrades << EOF
Unattended-Upgrade::Allowed-Origins {
    "\${distro_id}:\${distro_codename}";
    "\${distro_id}:\${distro_codename}-security";
    "\${distro_id}ESMApps:\${distro_codename}-apps-security";
    "\${distro_id}ESM:\${distro_codename}-infra-security";
};

Unattended-Upgrade::Package-Blacklist {
    // Blacklist packages here if needed
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Automatic-Reboot-Time "02:00";
EOF

cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
EOF

systemctl enable unattended-upgrades
systemctl start unattended-upgrades

log "Automatic security updates configured"

# Secure shared memory
log "Securing shared memory..."
if ! grep -q "tmpfs /run/shm tmpfs" /etc/fstab; then
    echo "tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0" >> /etc/fstab
fi

# Set up log monitoring
log "Setting up basic log monitoring..."

# Create log monitoring script
cat > /usr/local/bin/security-monitor.sh << 'EOF'
#!/bin/bash

# Basic security monitoring
LOG_FILE="/var/log/security-monitor.log"

# Check for failed SSH attempts
FAILED_SSH=$(grep "Failed password" /var/log/auth.log | tail -10 | wc -l)
if [ "$FAILED_SSH" -gt 5 ]; then
    echo "$(date): WARNING - $FAILED_SSH failed SSH attempts detected" >> "$LOG_FILE"
fi

# Check disk usage
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "$(date): WARNING - Disk usage is ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Check load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
if (( $(echo "$LOAD_AVG > 2.0" | bc -l) )); then
    echo "$(date): WARNING - High load average: $LOAD_AVG" >> "$LOG_FILE"
fi
EOF

chmod +x /usr/local/bin/security-monitor.sh

# Add to cron
(crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/security-monitor.sh") | crontab -

log "Security monitoring configured"

# Configure SSH security (if not already done)
log "Reviewing SSH configuration..."

SSH_CONFIG="/etc/ssh/sshd_config"
SSH_BACKUP="/etc/ssh/sshd_config.backup.$(date +%Y%m%d)"

# Backup SSH config
cp "$SSH_CONFIG" "$SSH_BACKUP"

# Check for security settings
if ! grep -q "^PermitRootLogin no" "$SSH_CONFIG"; then
    warn "Consider disabling root login: PermitRootLogin no"
fi

if ! grep -q "^PasswordAuthentication no" "$SSH_CONFIG"; then
    warn "Consider disabling password authentication: PasswordAuthentication no"
fi

# Install and configure logwatch (optional)
log "Installing log monitoring tools..."
apt install -y logwatch

# Configure logwatch
cat > /etc/logwatch/conf/logwatch.conf << EOF
LogDir = /var/log
TmpDir = /var/cache/logwatch
MailTo = root
MailFrom = logwatch@$(hostname)
Print = No
Save = /var/log/logwatch.log
Range = yesterday
Detail = Med
Service = All
Service = "-zz-network"
Service = "-zz-sys"
Service = "-eximstats"
EOF

log "Security hardening completed!"

echo ""
echo "=== SECURITY SUMMARY ==="
echo "✓ System packages updated"
echo "✓ UFW firewall configured and enabled"
echo "✓ Fail2Ban installed and configured"
echo "✓ Automatic security updates enabled"
echo "✓ Shared memory secured"
echo "✓ Basic log monitoring configured"
echo "✓ Logwatch installed"

echo ""
echo "=== OPEN PORTS ==="
ufw status numbered

echo ""
echo "=== RECOMMENDATIONS ==="
echo "1. Change SSH port from default 22:"
echo "   - Edit /etc/ssh/sshd_config"
echo "   - Change 'Port 22' to 'Port 2222'"
echo "   - Run: systemctl restart ssh"
echo "   - Update firewall: ufw allow 2222/tcp && ufw delete allow 22/tcp"

echo ""
echo "2. Disable password authentication (use SSH keys only):"
echo "   - Edit /etc/ssh/sshd_config"
echo "   - Set 'PasswordAuthentication no'"
echo "   - Run: systemctl restart ssh"

echo ""
echo "3. Monitor security logs:"
echo "   - SSH attempts: tail -f /var/log/auth.log"
echo "   - Fail2Ban: tail -f /var/log/fail2ban.log"
echo "   - Security monitor: tail -f /var/log/security-monitor.log"

echo ""
echo "4. Regular maintenance:"
echo "   - Check logs: logwatch"
echo "   - Update system: apt update && apt upgrade"
echo "   - Monitor disk space: df -h"

warn "Remember to test SSH access before logging out!"
warn "Current SSH port: $CURRENT_SSH_PORT"

log "Security hardening script completed successfully!"