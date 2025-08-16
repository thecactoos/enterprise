#!/bin/bash

# Container Health Monitoring Script for Enterprise CRM
# Monitors Docker containers, health endpoints, and resource usage

set -euo pipefail

# Configuration
PROJECT_DIR="/var/www/enterprise"
LOG_FILE="/var/log/container-health.log"
ALERT_EMAIL=""  # Set this if you want email alerts
WEBHOOK_URL=""  # Set this for Slack/Discord notifications
CPU_THRESHOLD=80      # CPU usage threshold (%)
MEMORY_THRESHOLD=80   # Memory usage threshold (%)
DISK_THRESHOLD=85     # Disk usage threshold (%)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Expected containers
EXPECTED_CONTAINERS=(
    "enterprise-postgres"
    "enterprise-api-gateway" 
    "enterprise-services-service"
    "enterprise-quotes-service"
    "enterprise-ocr-service"
    "enterprise-frontend"
    "enterprise-nginx"
)

# Health check endpoints
HEALTH_ENDPOINTS=(
    "http://localhost:3000/health:api-gateway"
    "http://localhost:3001/health:services-service"
    "http://localhost:3002/health:quotes-service"
    "http://localhost:8000/health:ocr-service"
)

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Alert function
alert() {
    local level=$1
    local message=$2
    
    log "[$level] $message"
    
    # Send webhook notification if configured
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -s -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\":\"[$level] Container Health - $message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$level] Container Health Alert" "$ALERT_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Check if Docker is running
check_docker() {
    log "Checking Docker daemon status"
    
    if ! docker info >/dev/null 2>&1; then
        alert "CRITICAL" "Docker daemon is not running"
        return 1
    fi
    
    log "Docker daemon: OK"
    return 0
}

# Check container status
check_container_status() {
    log "Checking container status"
    
    local failed_containers=()
    local exit_code=0
    
    for container in "${EXPECTED_CONTAINERS[@]}"; do
        local status
        status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
        
        case $status in
            "running")
                log "Container $container: running"
                ;;
            "exited"|"stopped")
                alert "CRITICAL" "Container $container is stopped"
                failed_containers+=("$container")
                exit_code=1
                ;;
            "restarting")
                alert "WARNING" "Container $container is restarting"
                exit_code=1
                ;;
            "not_found")
                alert "CRITICAL" "Container $container not found"
                failed_containers+=("$container")
                exit_code=1
                ;;
            *)
                alert "WARNING" "Container $container has unknown status: $status"
                exit_code=1
                ;;
        esac
    done
    
    # Attempt to restart failed containers
    if [[ ${#failed_containers[@]} -gt 0 ]]; then
        log "Attempting to restart failed containers: ${failed_containers[*]}"
        restart_containers "${failed_containers[@]}"
    fi
    
    return $exit_code
}

# Check container health endpoints
check_health_endpoints() {
    log "Checking health endpoints"
    
    local exit_code=0
    
    for endpoint_info in "${HEALTH_ENDPOINTS[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local service="${endpoint_info#*:}"
        
        log "Checking $service health endpoint: $endpoint"
        
        local response
        local http_code
        
        # Use timeout and retry logic
        response=$(curl -s -m 10 --retry 2 --retry-delay 5 -w "HTTP_CODE:%{http_code}" "$endpoint" 2>/dev/null || echo "FAILED")
        
        if [[ "$response" == "FAILED" ]]; then
            alert "CRITICAL" "$service health check failed - endpoint unreachable"
            exit_code=1
        else
            http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
            
            if [[ "$http_code" == "200" ]]; then
                log "$service health check: OK"
            else
                alert "CRITICAL" "$service health check failed - HTTP $http_code"
                exit_code=1
            fi
        fi
    done
    
    return $exit_code
}

# Check container resource usage
check_resource_usage() {
    log "Checking container resource usage"
    
    local exit_code=0
    
    # Get container stats
    local stats
    stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "")
    
    if [[ -z "$stats" ]]; then
        alert "WARNING" "Failed to retrieve container statistics"
        return 1
    fi
    
    # Parse stats and check thresholds
    while IFS=$'\t' read -r container cpu_perc mem_perc mem_usage; do
        # Skip header row
        [[ "$container" == "CONTAINER" ]] && continue
        
        # Extract numeric values
        local cpu_val
        local mem_val
        cpu_val=$(echo "$cpu_perc" | sed 's/%//' | cut -d. -f1)
        mem_val=$(echo "$mem_perc" | sed 's/%//' | cut -d. -f1)
        
        # Skip if values are not numeric
        [[ ! "$cpu_val" =~ ^[0-9]+$ ]] && continue
        [[ ! "$mem_val" =~ ^[0-9]+$ ]] && continue
        
        log "Container $container - CPU: ${cpu_perc}, Memory: ${mem_perc} (${mem_usage})"
        
        # Check CPU threshold
        if [[ $cpu_val -gt $CPU_THRESHOLD ]]; then
            alert "WARNING" "Container $container CPU usage high: ${cpu_perc}"
            exit_code=1
        fi
        
        # Check memory threshold
        if [[ $mem_val -gt $MEMORY_THRESHOLD ]]; then
            alert "WARNING" "Container $container memory usage high: ${mem_perc}"
            exit_code=1
        fi
        
    done <<< "$stats"
    
    return $exit_code
}

# Check system resources
check_system_resources() {
    log "Checking system resources"
    
    local exit_code=0
    
    # Check disk usage
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    log "System disk usage: ${disk_usage}%"
    
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        alert "CRITICAL" "System disk usage high: ${disk_usage}%"
        exit_code=1
    fi
    
    # Check system load
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    log "System load average: $load_avg"
    
    # Check available memory
    local mem_info
    mem_info=$(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
    
    log "System memory usage: $mem_info"
    
    return $exit_code
}

# Restart containers
restart_containers() {
    local containers=("$@")
    
    for container in "${containers[@]}"; do
        log "Restarting container: $container"
        
        if docker restart "$container" >/dev/null 2>&1; then
            log "Successfully restarted $container"
            alert "INFO" "Container $container has been restarted"
            
            # Wait a bit and check if it's running
            sleep 10
            local status
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "unknown")
            
            if [[ "$status" == "running" ]]; then
                log "Container $container is now running after restart"
            else
                alert "CRITICAL" "Container $container failed to start after restart (status: $status)"
            fi
        else
            alert "CRITICAL" "Failed to restart container $container"
        fi
    done
}

# Check Docker Compose services
check_compose_services() {
    log "Checking Docker Compose services status"
    
    cd "$PROJECT_DIR" || {
        alert "CRITICAL" "Failed to change to project directory: $PROJECT_DIR"
        return 1
    }
    
    local compose_status
    compose_status=$(docker compose -f docker-compose.prod.yml ps --format json 2>/dev/null || echo "[]")
    
    if [[ "$compose_status" == "[]" ]]; then
        alert "WARNING" "No Docker Compose services found or failed to get status"
        return 1
    fi
    
    log "Docker Compose services status retrieved"
    
    # Parse JSON and check service health
    echo "$compose_status" | jq -r '.[] | "\(.Name):\(.State):\(.Health)"' 2>/dev/null | while IFS=: read -r name state health; do
        log "Service $name - State: $state, Health: $health"
        
        if [[ "$state" != "running" ]]; then
            alert "CRITICAL" "Service $name is not running (state: $state)"
        fi
        
        if [[ "$health" == "unhealthy" ]]; then
            alert "CRITICAL" "Service $name is unhealthy"
        fi
    done
    
    return 0
}

# Generate health report
generate_health_report() {
    log "Generating health report"
    
    cat << EOF

=== ENTERPRISE CRM HEALTH REPORT ===
Generated: $(date)

CONTAINER STATUS:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep enterprise || echo "No enterprise containers running")

RESOURCE USAGE:
$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}\t{{.MemUsage}}" | head -10)

SYSTEM RESOURCES:
Disk Usage: $(df -h / | awk 'NR==2 {print $5}')
Memory Usage: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')
Load Average: $(uptime | awk -F'load average:' '{print $2}')

DOCKER COMPOSE STATUS:
$(cd "$PROJECT_DIR" && docker compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Failed to get compose status")

EOF
}

# Main monitoring function
main() {
    log "Starting container health monitoring"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    local exit_code=0
    
    # Run all checks
    check_docker || exit_code=1
    check_container_status || exit_code=1
    check_health_endpoints || exit_code=1
    check_resource_usage || exit_code=1
    check_system_resources || exit_code=1
    check_compose_services || exit_code=1
    
    # Generate report
    generate_health_report
    
    if [[ $exit_code -eq 0 ]]; then
        log "Container health monitoring completed successfully"
        echo -e "${GREEN}✓ Container health monitoring completed successfully${NC}"
    else
        log "Container health monitoring completed with warnings/errors"
        echo -e "${YELLOW}⚠ Container health monitoring completed with warnings/errors${NC}"
    fi
    
    return $exit_code
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi