#!/bin/bash

# Alert Manager for Enterprise CRM Monitoring
# Handles automated recovery actions and escalated alerts

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/var/www/enterprise"
LOG_FILE="/var/log/alert-manager.log"
RECOVERY_LOG="/var/log/recovery-actions.log"
ALERT_EMAIL=""  # Set this if you want email alerts
WEBHOOK_URL=""  # Set this for Slack/Discord notifications

# Recovery attempt limits
MAX_CONTAINER_RESTARTS=3
MAX_SERVICE_RESTARTS=2
RECOVERY_COOLDOWN=300  # 5 minutes between recovery attempts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Recovery logging function
recovery_log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$RECOVERY_LOG"
}

# Alert function with severity levels
alert() {
    local level=$1
    local component=$2
    local message=$3
    local recovery_action="${4:-none}"
    
    log "[$level] $component: $message"
    
    # Create alert payload
    local alert_payload
    alert_payload=$(cat <<EOF
{
    "timestamp": "$(date -Iseconds)",
    "level": "$level",
    "component": "$component",
    "message": "$message",
    "recovery_action": "$recovery_action",
    "hostname": "$(hostname)",
    "system": "Enterprise CRM - cactoos.digital"
}
EOF
)
    
    # Send webhook notification if configured
    if [[ -n "$WEBHOOK_URL" ]]; then
        local webhook_message
        case $level in
            "CRITICAL")
                webhook_message="🚨 **CRITICAL ALERT** 🚨\n**Component:** $component\n**Message:** $message\n**Recovery:** $recovery_action\n**Time:** $(date)"
                ;;
            "WARNING")
                webhook_message="⚠️ **WARNING** ⚠️\n**Component:** $component\n**Message:** $message\n**Time:** $(date)"
                ;;
            "INFO")
                webhook_message="ℹ️ **INFO**\n**Component:** $component\n**Message:** $message\n**Time:** $(date)"
                ;;
            *)
                webhook_message="**$level**\n**Component:** $component\n**Message:** $message\n**Time:** $(date)"
                ;;
        esac
        
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"$webhook_message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo -e "Alert Details:\n$alert_payload" | mail -s "[$level] Enterprise CRM Alert - $component" "$ALERT_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Check if recovery is allowed (cooldown period)
is_recovery_allowed() {
    local component=$1
    local recovery_file="/tmp/recovery_${component}_$(date +%Y%m%d)"
    
    if [[ -f "$recovery_file" ]]; then
        local last_recovery
        last_recovery=$(cat "$recovery_file" 2>/dev/null || echo "0")
        local current_time
        current_time=$(date +%s)
        
        if [[ $((current_time - last_recovery)) -lt $RECOVERY_COOLDOWN ]]; then
            return 1
        fi
    fi
    
    return 0
}

# Mark recovery attempt
mark_recovery_attempt() {
    local component=$1
    local recovery_file="/tmp/recovery_${component}_$(date +%Y%m%d)"
    
    date +%s > "$recovery_file"
}

# Restart Docker container with safety checks
restart_container() {
    local container_name=$1
    
    if ! is_recovery_allowed "container_$container_name"; then
        recovery_log "Recovery cooldown active for container $container_name, skipping restart"
        return 1
    fi
    
    recovery_log "Attempting to restart container: $container_name"
    
    # Check current container status
    local container_status
    container_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
    
    if [[ "$container_status" == "not_found" ]]; then
        recovery_log "Container $container_name not found, attempting to start from compose"
        
        cd "$PROJECT_DIR" || return 1
        
        if docker compose -f docker-compose.prod.yml up -d "$container_name" >/dev/null 2>&1; then
            recovery_log "Successfully started container $container_name from compose"
            mark_recovery_attempt "container_$container_name"
            alert "INFO" "Container Recovery" "Container $container_name started from compose" "automatic_start"
            return 0
        else
            recovery_log "Failed to start container $container_name from compose"
            alert "CRITICAL" "Container Recovery" "Failed to start container $container_name from compose" "manual_intervention_required"
            return 1
        fi
    fi
    
    # Attempt restart
    if docker restart "$container_name" >/dev/null 2>&1; then
        recovery_log "Successfully restarted container: $container_name"
        mark_recovery_attempt "container_$container_name"
        
        # Wait and verify
        sleep 10
        local new_status
        new_status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "unknown")
        
        if [[ "$new_status" == "running" ]]; then
            recovery_log "Container $container_name is running after restart"
            alert "INFO" "Container Recovery" "Container $container_name successfully restarted" "automatic_restart"
            return 0
        else
            recovery_log "Container $container_name failed to start properly after restart (status: $new_status)"
            alert "CRITICAL" "Container Recovery" "Container $container_name failed to start after restart" "manual_intervention_required"
            return 1
        fi
    else
        recovery_log "Failed to restart container: $container_name"
        alert "CRITICAL" "Container Recovery" "Failed to restart container $container_name" "manual_intervention_required"
        return 1
    fi
}

# Restart Docker Compose services
restart_compose_service() {
    local service_name=$1
    
    if ! is_recovery_allowed "service_$service_name"; then
        recovery_log "Recovery cooldown active for service $service_name, skipping restart"
        return 1
    fi
    
    recovery_log "Attempting to restart compose service: $service_name"
    
    cd "$PROJECT_DIR" || return 1
    
    if docker compose -f docker-compose.prod.yml restart "$service_name" >/dev/null 2>&1; then
        recovery_log "Successfully restarted service: $service_name"
        mark_recovery_attempt "service_$service_name"
        alert "INFO" "Service Recovery" "Service $service_name successfully restarted" "automatic_restart"
        return 0
    else
        recovery_log "Failed to restart service: $service_name"
        alert "CRITICAL" "Service Recovery" "Failed to restart service $service_name" "manual_intervention_required"
        return 1
    fi
}

# Handle SSL certificate issues
handle_ssl_issues() {
    local issue_type=$1
    local details=$2
    
    case $issue_type in
        "expiring_soon")
            recovery_log "SSL certificate expiring soon, attempting renewal"
            
            if command -v certbot >/dev/null 2>&1; then
                if certbot renew --quiet 2>/dev/null; then
                    recovery_log "SSL certificate renewal successful"
                    alert "INFO" "SSL Recovery" "SSL certificate successfully renewed" "automatic_renewal"
                    
                    # Reload nginx to pick up new certificate
                    if docker exec enterprise-nginx nginx -s reload >/dev/null 2>&1; then
                        recovery_log "Nginx reloaded after certificate renewal"
                    fi
                    
                    return 0
                else
                    recovery_log "SSL certificate renewal failed"
                    alert "CRITICAL" "SSL Recovery" "SSL certificate renewal failed - manual intervention required" "manual_intervention_required"
                    return 1
                fi
            else
                alert "CRITICAL" "SSL Recovery" "Certbot not found - cannot attempt automatic renewal" "install_certbot"
                return 1
            fi
            ;;
        "expired")
            alert "CRITICAL" "SSL Certificate" "SSL certificate has expired!" "immediate_renewal_required"
            return 1
            ;;
        *)
            alert "WARNING" "SSL Certificate" "SSL issue detected: $details" "investigate"
            return 1
            ;;
    esac
}

# Handle high resource usage
handle_high_resource_usage() {
    local resource_type=$1
    local usage_percent=$2
    local threshold=$3
    
    recovery_log "High $resource_type usage detected: ${usage_percent}% (threshold: ${threshold}%)"
    
    case $resource_type in
        "memory")
            # Try to free memory by restarting non-critical services
            recovery_log "Attempting to free memory by restarting OCR service"
            if restart_container "enterprise-ocr-service"; then
                alert "INFO" "Resource Recovery" "Restarted OCR service to free memory" "automatic_restart"
            fi
            ;;
        "disk")
            # Clean up logs and temporary files
            recovery_log "Attempting to free disk space"
            
            # Clean Docker logs
            if docker system prune -f --volumes >/dev/null 2>&1; then
                recovery_log "Docker system cleanup completed"
            fi
            
            # Clean old log files
            find /var/log -name "*.log" -mtime +7 -delete 2>/dev/null || true
            
            alert "INFO" "Resource Recovery" "Performed disk cleanup" "automatic_cleanup"
            ;;
        "cpu")
            # Log high CPU usage for investigation
            recovery_log "High CPU usage detected, logging top processes"
            ps aux --sort=-%cpu | head -10 >> "$RECOVERY_LOG"
            alert "WARNING" "Resource Usage" "High CPU usage detected" "investigate_processes"
            ;;
    esac
}

# Handle database connectivity issues
handle_database_issues() {
    local issue_type=$1
    
    case $issue_type in
        "connection_failed")
            recovery_log "Database connection failed, attempting container restart"
            if restart_container "enterprise-postgres"; then
                # Wait for database to be ready
                sleep 30
                
                # Test connection again
                if docker exec enterprise-postgres pg_isready >/dev/null 2>&1; then
                    recovery_log "Database connection restored after restart"
                    alert "INFO" "Database Recovery" "Database connection restored" "automatic_restart"
                    return 0
                else
                    recovery_log "Database still not accessible after restart"
                    alert "CRITICAL" "Database Recovery" "Database not accessible after restart" "manual_intervention_required"
                    return 1
                fi
            fi
            ;;
        "high_connections")
            recovery_log "High database connection usage detected"
            
            # Restart API services to reset connections
            restart_container "enterprise-api-gateway"
            restart_container "enterprise-services-service"
            restart_container "enterprise-quotes-service"
            
            alert "WARNING" "Database Performance" "Restarted API services due to high connection usage" "automatic_restart"
            ;;
    esac
}

# Process monitoring results and trigger recovery actions
process_monitoring_results() {
    local status_file="/var/log/system-status.json"
    
    if [[ ! -f "$status_file" ]]; then
        log "Status file not found, running basic checks"
        return 1
    fi
    
    # Check if jq is available for JSON parsing
    if ! command -v jq >/dev/null 2>&1; then
        log "jq not available, cannot process detailed status"
        return 1
    fi
    
    log "Processing monitoring results for automated recovery"
    
    # Check each monitoring component status
    local components
    components=$(jq -r 'keys[]' "$status_file" 2>/dev/null || echo "")
    
    for component in $components; do
        local status exit_code
        status=$(jq -r ".\"$component\".status" "$status_file" 2>/dev/null || echo "unknown")
        exit_code=$(jq -r ".\"$component\".exit_code" "$status_file" 2>/dev/null || echo "0")
        
        if [[ "$status" == "ERROR" ]] && [[ "$exit_code" != "0" ]]; then
            log "Component $component reported errors, checking for recovery actions"
            
            case $component in
                "ssl-monitor")
                    # Check SSL-specific recovery actions
                    local output
                    output=$(jq -r ".\"$component\".output" "$status_file" 2>/dev/null || echo "")
                    
                    if echo "$output" | grep -q "expires in.*days"; then
                        local days
                        days=$(echo "$output" | grep -o "expires in [0-9]* days" | grep -o "[0-9]*" | head -1)
                        if [[ -n "$days" ]] && [[ "$days" -le 30 ]]; then
                            handle_ssl_issues "expiring_soon" "$days days remaining"
                        fi
                    fi
                    ;;
                "container-health-monitor")
                    # Check for container restart needs
                    local output
                    output=$(jq -r ".\"$component\".output" "$status_file" 2>/dev/null || echo "")
                    
                    # Look for failed containers in output
                    echo "$output" | grep -o "enterprise-[a-zA-Z-]*" | while read -r container; do
                        if echo "$output" | grep -q "$container.*stopped\|$container.*exited"; then
                            restart_container "$container"
                        fi
                    done
                    ;;
                "infrastructure-monitor")
                    # Check for infrastructure issues
                    local output
                    output=$(jq -r ".\"$component\".output" "$status_file" 2>/dev/null || echo "")
                    
                    if echo "$output" | grep -q "Database connection failed"; then
                        handle_database_issues "connection_failed"
                    fi
                    
                    if echo "$output" | grep -q "High.*usage"; then
                        # Parse resource usage alerts
                        echo "$output" | grep "High.*usage" | while read -r line; do
                            if echo "$line" | grep -q "memory"; then
                                local usage
                                usage=$(echo "$line" | grep -o "[0-9]*%" | sed 's/%//')
                                [[ -n "$usage" ]] && handle_high_resource_usage "memory" "$usage" "80"
                            elif echo "$line" | grep -q "disk"; then
                                local usage
                                usage=$(echo "$line" | grep -o "[0-9]*%" | sed 's/%//')
                                [[ -n "$usage" ]] && handle_high_resource_usage "disk" "$usage" "85"
                            fi
                        done
                    fi
                    ;;
            esac
        fi
    done
}

# Generate recovery report
generate_recovery_report() {
    if [[ ! -f "$RECOVERY_LOG" ]]; then
        echo "No recovery actions performed today."
        return 0
    fi
    
    local today
    today=$(date +%Y-%m-%d)
    
    echo "=== RECOVERY ACTIONS REPORT - $today ==="
    echo ""
    
    grep "^$today" "$RECOVERY_LOG" 2>/dev/null || echo "No recovery actions found for today."
    
    echo ""
    echo "=== RECOVERY STATISTICS ==="
    local total_actions container_restarts service_restarts
    total_actions=$(grep -c "Attempting to" "$RECOVERY_LOG" 2>/dev/null || echo "0")
    container_restarts=$(grep -c "restart container" "$RECOVERY_LOG" 2>/dev/null || echo "0")
    service_restarts=$(grep -c "restart.*service" "$RECOVERY_LOG" 2>/dev/null || echo "0")
    
    echo "Total recovery actions: $total_actions"
    echo "Container restarts: $container_restarts"
    echo "Service restarts: $service_restarts"
}

# Main function
main() {
    local action="${1:-monitor}"
    
    # Create log directories
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$RECOVERY_LOG")"
    
    case $action in
        "monitor"|"m")
            log "Starting alert manager monitoring cycle"
            process_monitoring_results
            ;;
        "test"|"t")
            log "Testing alert manager functionality"
            alert "INFO" "Alert Manager" "Test alert from alert manager" "test"
            echo -e "${GREEN}✓ Test alert sent${NC}"
            ;;
        "report"|"r")
            generate_recovery_report
            ;;
        "restart-container")
            local container_name="${2:-}"
            if [[ -z "$container_name" ]]; then
                echo "Usage: $0 restart-container <container_name>"
                return 1
            fi
            restart_container "$container_name"
            ;;
        "restart-service")
            local service_name="${2:-}"
            if [[ -z "$service_name" ]]; then
                echo "Usage: $0 restart-service <service_name>"
                return 1
            fi
            restart_compose_service "$service_name"
            ;;
        *)
            echo "Usage: $0 [monitor|test|report|restart-container|restart-service]"
            echo "  monitor              - Process monitoring results and trigger recovery (default)"
            echo "  test                 - Send test alert"
            echo "  report               - Generate recovery actions report"
            echo "  restart-container    - Manual container restart"
            echo "  restart-service      - Manual service restart"
            return 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi