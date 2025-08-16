# Enterprise CRM Monitoring System

Comprehensive monitoring and alerting system for the Enterprise CRM production environment at `cactoos.digital`.

## 🚀 Quick Start

### Installation
```bash
# Run as root
sudo /var/www/enterprise/monitoring/install-monitoring.sh
```

### Immediate Health Check
```bash
# Quick system health check
enterprise-monitor quick

# Full status report
enterprise-monitor status

# Live monitoring dashboard
/var/www/enterprise/monitoring/dashboard.sh
```

## 📊 Monitoring Components

### 1. SSL Certificate Monitoring (`ssl-monitor.sh`)
- **Purpose**: Monitor SSL certificate expiry and security
- **Checks**: Certificate expiry, auto-renewal, security headers, TLS versions
- **Frequency**: Every 6 hours
- **Alerts**: 30-day, 7-day expiry warnings

### 2. Container Health Monitoring (`container-health-monitor.sh`)
- **Purpose**: Monitor Docker containers and microservices
- **Checks**: Container status, health endpoints, resource usage
- **Frequency**: Every 2 minutes
- **Auto-Recovery**: Automatic container restart on failure

### 3. Infrastructure Monitoring (`infrastructure-monitor.sh`)
- **Purpose**: Monitor database, nginx, API gateway, system resources
- **Checks**: Database connectivity, web endpoints, system performance
- **Frequency**: Every 10 minutes
- **Alerts**: High resource usage, service failures

### 4. System Monitor (`system-monitor.sh`)
- **Purpose**: Orchestrate all monitoring components
- **Modes**: `full`, `quick`, `status`
- **Frequency**: Every 5 minutes (full monitoring)
- **Output**: Comprehensive system health report

### 5. Alert Manager (`alert-manager.sh`)
- **Purpose**: Automated recovery actions and alert escalation
- **Features**: Container restart, service recovery, alert notifications
- **Frequency**: Every 3 minutes
- **Recovery**: Automatic issue resolution with cooldown periods

### 6. Real-time Dashboard (`dashboard.sh`)
- **Purpose**: Live monitoring dashboard with real-time metrics
- **Features**: Interactive display, container stats, performance metrics
- **Usage**: `./dashboard.sh` for live view

## 🔧 Configuration

### Main Configuration File
`/etc/monitoring/enterprise-monitoring.conf`

```bash
# Domain to monitor
DOMAIN="cactoos.digital"

# Alert settings
ALERT_EMAIL="admin@yourdomain.com"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Thresholds
SSL_ALERT_DAYS=30
CPU_THRESHOLD=80
MEMORY_THRESHOLD=80
DISK_THRESHOLD=85
```

### Webhook Integration
Supports Slack, Discord, or any webhook-compatible service:

```bash
# Slack webhook example
WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"

# Discord webhook example  
WEBHOOK_URL="https://discord.com/api/webhooks/123456789/abcdefghijklmnop"
```

## 📋 Automated Monitoring Schedule

| Check | Frequency | Purpose |
|-------|-----------|---------|
| Full System Monitoring | 5 minutes | Complete health check |
| Container Health | 2 minutes | Container status and restart |
| SSL Certificate | 6 hours | Certificate expiry monitoring |
| Infrastructure | 10 minutes | Database, nginx, API health |
| Alert Processing | 3 minutes | Automated recovery actions |
| Daily Reports | 6 AM | Recovery actions summary |
| Log Cleanup | Weekly | Remove old logs (30+ days) |

## 🚨 Alert Levels

### Critical Alerts
- SSL certificate expired or failing
- Database connection lost
- Multiple containers down
- System disk >85% full
- API endpoints unreachable

### Warning Alerts
- SSL certificate expires <30 days
- High resource usage (CPU/Memory >80%)
- Container restarts
- Slow API response times
- High error rates

### Info Alerts
- Successful recovery actions
- System status reports
- Backup completions

## 🔄 Automated Recovery Actions

### Container Failures
1. **Detection**: Container not running or unhealthy
2. **Action**: Automatic restart with Docker
3. **Verification**: Health check after restart
4. **Cooldown**: 5-minute cooldown between attempts
5. **Escalation**: Alert if restart fails

### Service Failures
1. **Detection**: Health endpoint failures
2. **Action**: Docker Compose service restart
3. **Verification**: Endpoint response check
4. **Limits**: Max 3 restart attempts per day

### Resource Issues
1. **High Memory**: Restart OCR service (non-critical)
2. **High Disk**: Cleanup Docker logs and temp files
3. **High CPU**: Log processes for investigation

### SSL Issues
1. **Expiring Certificate**: Automatic certbot renewal
2. **Renewal Success**: Nginx reload
3. **Renewal Failure**: Immediate critical alert

## 📁 Log Files

| Log File | Purpose | Retention |
|----------|---------|-----------|
| `/var/log/system-monitor.log` | Main monitoring log | 30 days |
| `/var/log/ssl-monitor.log` | SSL certificate monitoring | 30 days |
| `/var/log/container-health.log` | Container health checks | 30 days |
| `/var/log/infrastructure-monitor.log` | Infrastructure monitoring | 30 days |
| `/var/log/alert-manager.log` | Alert and recovery actions | 30 days |
| `/var/log/recovery-actions.log` | Automated recovery log | 30 days |
| `/var/log/cron-monitoring.log` | Cron job execution log | 30 days |

## 🛠️ Command Reference

### Quick Commands
```bash
# System health check
enterprise-monitor quick

# Full status report
enterprise-monitor status

# SSL certificate check
enterprise-ssl-check

# Container health check
enterprise-health-check

# Infrastructure check
enterprise-infra-check

# Test alerts
enterprise-alerts test

# View recovery report
enterprise-alerts report
```

### Manual Recovery
```bash
# Restart specific container
enterprise-alerts restart-container enterprise-api-gateway

# Restart compose service
enterprise-alerts restart-service api-gateway

# Manual monitoring run
enterprise-monitor full
```

### Dashboard
```bash
# Interactive dashboard
/var/www/enterprise/monitoring/dashboard.sh

# Single status display
/var/www/enterprise/monitoring/dashboard.sh static
```

## 🔍 Troubleshooting

### Common Issues

#### Monitoring Not Running
```bash
# Check cron jobs
sudo crontab -l | grep enterprise

# Check cron service
sudo systemctl status cron

# Manual test
sudo /var/www/enterprise/monitoring/system-monitor.sh full
```

#### High False Positives
```bash
# Adjust thresholds in config
sudo nano /etc/monitoring/enterprise-monitoring.conf

# Restart monitoring
sudo systemctl restart cron
```

#### Missing Dependencies
```bash
# Reinstall dependencies
sudo /var/www/enterprise/monitoring/install-monitoring.sh
```

#### Webhook Not Working
```bash
# Test webhook manually
curl -X POST "$WEBHOOK_URL" -H "Content-Type: application/json" -d '{"text":"Test message"}'

# Check webhook URL in config
sudo nano /etc/monitoring/enterprise-monitoring.conf
```

### Log Analysis
```bash
# Check recent alerts
tail -f /var/log/system-monitor.log

# Search for errors
grep -i error /var/log/*.log

# Monitor real-time
watch 'enterprise-monitor quick'
```

## 📊 Performance Impact

- **CPU Usage**: <1% average system CPU
- **Memory Usage**: ~50MB RAM for monitoring processes  
- **Disk I/O**: Minimal, logs rotate automatically
- **Network**: <1KB/min for health checks
- **Container Impact**: Health checks use existing endpoints

## 🔒 Security Considerations

- All scripts run as root for system monitoring
- Webhooks use HTTPS for secure alert delivery
- Log files protected with proper permissions (644)
- No sensitive data logged (passwords, tokens)
- SSL monitoring doesn't expose private keys

## 🚀 Advanced Features

### Custom Monitoring Scripts
Add custom monitoring by:
1. Creating script in `/var/www/enterprise/monitoring/`
2. Adding to cron configuration
3. Following existing script patterns

### Integration with External Monitoring
- Metrics can be exported to Prometheus
- Logs compatible with ELK stack
- JSON status output for external tools

### Scaling Considerations
- Scripts designed for single-server deployment
- Can be extended for multi-server monitoring
- Database queries optimized for minimal impact

## 📞 Support

### Emergency Response
1. **Check Dashboard**: `/var/www/enterprise/monitoring/dashboard.sh`
2. **Review Logs**: `/var/log/system-monitor.log`
3. **Manual Recovery**: Use `enterprise-alerts` commands
4. **System Status**: `enterprise-monitor status`

### Monitoring Health
```bash
# Verify monitoring is working
ls -la /var/log/*monitor*.log | head -5
tail -20 /var/log/cron-monitoring.log
```

This monitoring system provides comprehensive coverage of your Enterprise CRM infrastructure with automated recovery capabilities, ensuring maximum uptime and early detection of issues.