#!/bin/bash

# Infrastructure Monitoring Script for Enterprise CRM
# Monitors database, nginx, API gateway, and system infrastructure

set -euo pipefail

# Configuration
PROJECT_DIR="/var/www/enterprise"
LOG_FILE="/var/log/infrastructure-monitor.log"
ALERT_EMAIL=""  # Set this if you want email alerts
WEBHOOK_URL=""  # Set this for Slack/Discord notifications
DB_CONNECTION_TIMEOUT=10
API_RESPONSE_THRESHOLD=5000  # Response time threshold in ms
NGINX_ERROR_THRESHOLD=10     # Max errors per minute

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration (from environment or defaults)
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-enterprise_crm}"
DB_USER="${POSTGRES_USER:-postgres}"

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
            -d "{\"text\":\"[$level] Infrastructure Monitor - $message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$level] Infrastructure Alert" "$ALERT_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Check database connectivity and health
check_database() {
    log "Checking PostgreSQL database connectivity"
    
    local exit_code=0
    
    # Check if postgres container is running
    if ! docker ps --format '{{.Names}}' | grep -q "enterprise-postgres"; then
        alert "CRITICAL" "PostgreSQL container is not running"
        return 1
    fi
    
    # Test database connection
    local connection_test
    connection_test=$(docker exec enterprise-postgres pg_isready -h localhost -p 5432 -U "$DB_USER" 2>/dev/null || echo "FAILED")
    
    if [[ "$connection_test" == "FAILED" ]]; then
        alert "CRITICAL" "PostgreSQL database connection failed"
        exit_code=1
    else
        log "PostgreSQL connection: OK"
    fi
    
    # Check database size and connections
    local db_stats
    db_stats=$(docker exec enterprise-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT 
            pg_database_size('$DB_NAME') as db_size,
            (SELECT count(*) FROM pg_stat_activity WHERE datname='$DB_NAME') as connections,
            (SELECT setting FROM pg_settings WHERE name='max_connections') as max_connections;
    " 2>/dev/null || echo "")
    
    if [[ -n "$db_stats" ]]; then
        local db_size connections max_connections
        read -r db_size connections max_connections <<< "$db_stats"
        
        # Convert bytes to MB
        db_size_mb=$((db_size / 1024 / 1024))
        
        log "Database size: ${db_size_mb}MB, Active connections: ${connections}/${max_connections}"
        
        # Alert if connection usage is high
        local connection_usage_percent=$((connections * 100 / max_connections))
        if [[ $connection_usage_percent -gt 80 ]]; then
            alert "WARNING" "Database connection usage high: ${connection_usage_percent}%"
            exit_code=1
        fi
        
        # Alert if database size is very large (>1GB)
        if [[ $db_size_mb -gt 1024 ]]; then
            alert "INFO" "Database size is large: ${db_size_mb}MB - consider cleanup"
        fi
    else
        alert "WARNING" "Failed to retrieve database statistics"
        exit_code=1
    fi
    
    # Check for long-running queries
    check_long_running_queries
    
    return $exit_code
}

# Check for long-running queries
check_long_running_queries() {
    log "Checking for long-running database queries"
    
    local long_queries
    long_queries=$(docker exec enterprise-postgres psql -U "$DB_USER" -d "$DB_NAME" -t -c "
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE state = 'active' 
        AND query_start < now() - interval '5 minutes'
        AND query NOT LIKE '%pg_stat_activity%';
    " 2>/dev/null || echo "0")
    
    if [[ "$long_queries" -gt 0 ]]; then
        alert "WARNING" "Found $long_queries long-running queries (>5 minutes)"
        
        # Log the actual queries for debugging
        docker exec enterprise-postgres psql -U "$DB_USER" -d "$DB_NAME" -c "
            SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' 
            AND query_start < now() - interval '5 minutes'
            AND query NOT LIKE '%pg_stat_activity%';
        " 2>/dev/null | head -20 >> "$LOG_FILE" || true
    else
        log "Long-running queries check: OK"
    fi
}

# Check Nginx health and performance
check_nginx() {
    log "Checking Nginx reverse proxy health"
    
    local exit_code=0
    
    # Check if nginx container is running
    if ! docker ps --format '{{.Names}}' | grep -q "enterprise-nginx"; then
        alert "CRITICAL" "Nginx container is not running"
        return 1
    fi
    
    # Test nginx configuration
    if docker exec enterprise-nginx nginx -t >/dev/null 2>&1; then
        log "Nginx configuration: OK"
    else
        alert "CRITICAL" "Nginx configuration test failed"
        exit_code=1
    fi
    
    # Check nginx access logs for errors
    check_nginx_errors
    
    # Test HTTP/HTTPS endpoints
    check_web_endpoints
    
    return $exit_code
}

# Check nginx error logs
check_nginx_errors() {
    log "Checking Nginx error logs"
    
    # Check for recent errors (last 10 minutes)
    local recent_errors
    recent_errors=$(docker exec enterprise-nginx sh -c "
        find /var/log/nginx -name '*.log' -exec grep -h \"$(date -d '10 minutes ago' '+%d/%b/%Y:%H:%M')\" {} \; 2>/dev/null | 
        grep -i error | wc -l
    " 2>/dev/null || echo "0")
    
    if [[ "$recent_errors" -gt $NGINX_ERROR_THRESHOLD ]]; then
        alert "WARNING" "High number of Nginx errors in last 10 minutes: $recent_errors"
        
        # Show recent errors
        docker exec enterprise-nginx sh -c "
            find /var/log/nginx -name 'error.log' -exec tail -10 {} \;
        " 2>/dev/null >> "$LOG_FILE" || true
    else
        log "Nginx error check: OK ($recent_errors errors in last 10 minutes)"
    fi
}

# Check web endpoints
check_web_endpoints() {
    log "Checking web endpoints"
    
    local endpoints=(
        "https://cactoos.digital/:Homepage"
        "https://cactoos.digital/api/health:API Health"
    )
    
    local exit_code=0
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local name="${endpoint_info#*:}"
        
        log "Testing $name: $endpoint"
        
        # Measure response time
        local response_time
        local http_code
        
        response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time 30 "$endpoint" 2>/dev/null || echo "timeout")
        http_code=$(curl -s -w "%{http_code}" -o /dev/null --max-time 30 "$endpoint" 2>/dev/null || echo "000")
        
        if [[ "$response_time" == "timeout" ]]; then
            alert "CRITICAL" "$name endpoint timeout"
            exit_code=1
        elif [[ "$http_code" != "200" ]]; then
            alert "CRITICAL" "$name returned HTTP $http_code"
            exit_code=1
        else
            # Convert response time to milliseconds
            local response_ms
            response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
            
            log "$name response: ${response_ms}ms (HTTP $http_code)"
            
            if [[ $response_ms -gt $API_RESPONSE_THRESHOLD ]]; then
                alert "WARNING" "$name slow response: ${response_ms}ms"
                exit_code=1
            fi
        fi
    done
    
    return $exit_code
}

# Check API Gateway performance
check_api_gateway() {
    log "Checking API Gateway performance"
    
    local exit_code=0
    
    # Check if API gateway container is running
    if ! docker ps --format '{{.Names}}' | grep -q "enterprise-api-gateway"; then
        alert "CRITICAL" "API Gateway container is not running"
        return 1
    fi
    
    # Test API endpoints
    local api_endpoints=(
        "http://localhost:3000/health:API Gateway Health"
        "http://localhost:3000/api/services:Services API"
        "http://localhost:3000/api/quotes:Quotes API"
    )
    
    for endpoint_info in "${api_endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local name="${endpoint_info#*:}"
        
        log "Testing $name: $endpoint"
        
        local response
        response=$(curl -s -m 10 "$endpoint" 2>/dev/null || echo "FAILED")
        
        if [[ "$response" == "FAILED" ]]; then
            alert "CRITICAL" "$name endpoint failed"
            exit_code=1
        else
            log "$name: OK"
        fi
    done
    
    # Check API Gateway logs for errors
    check_api_gateway_logs
    
    return $exit_code
}

# Check API Gateway logs
check_api_gateway_logs() {
    log "Checking API Gateway logs for errors"
    
    local recent_errors
    recent_errors=$(docker logs --since=10m enterprise-api-gateway 2>&1 | grep -i error | wc -l || echo "0")
    
    if [[ "$recent_errors" -gt 10 ]]; then
        alert "WARNING" "High number of API Gateway errors in last 10 minutes: $recent_errors"
        
        # Show recent errors
        docker logs --since=10m --tail=20 enterprise-api-gateway 2>&1 | grep -i error >> "$LOG_FILE" || true
    else
        log "API Gateway error check: OK ($recent_errors errors in last 10 minutes)"
    fi
}

# Check system resources and performance
check_system_performance() {
    log "Checking system performance metrics"
    
    local exit_code=0
    
    # Check system load
    local load_1min load_5min load_15min
    read -r load_1min load_5min load_15min < <(uptime | awk -F'load average:' '{print $2}' | sed 's/,//g')
    
    log "System load: 1min=$load_1min, 5min=$load_5min, 15min=$load_15min"
    
    # Get number of CPU cores
    local cpu_cores
    cpu_cores=$(nproc)
    
    # Alert if 1-minute load is high
    if (( $(echo "$load_1min > $cpu_cores" | bc -l) )); then
        alert "WARNING" "High system load: $load_1min (cores: $cpu_cores)"
        exit_code=1
    fi
    
    # Check memory usage
    local mem_total mem_used mem_free mem_percent
    read -r mem_total mem_used mem_free < <(free -m | awk 'NR==2{print $2, $3, $4}')
    mem_percent=$((mem_used * 100 / mem_total))
    
    log "Memory usage: ${mem_used}MB/${mem_total}MB (${mem_percent}%)"
    
    if [[ $mem_percent -gt 85 ]]; then
        alert "WARNING" "High memory usage: ${mem_percent}%"
        exit_code=1
    fi
    
    # Check I/O wait
    local iowait
    iowait=$(iostat -c 1 2 2>/dev/null | tail -1 | awk '{print $4}' || echo "0")
    
    log "I/O wait: ${iowait}%"
    
    if (( $(echo "$iowait > 20" | bc -l) )); then
        alert "WARNING" "High I/O wait: ${iowait}%"
        exit_code=1
    fi
    
    return $exit_code
}

# Check backup status
check_backup_status() {
    log "Checking backup status"
    
    # Check if backup directory exists
    local backup_dir="/var/backups/enterprise-crm"
    
    if [[ ! -d "$backup_dir" ]]; then
        alert "WARNING" "Backup directory not found: $backup_dir"
        return 1
    fi
    
    # Find most recent backup
    local latest_backup
    latest_backup=$(find "$backup_dir" -name "*.sql*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2- || echo "")
    
    if [[ -z "$latest_backup" ]]; then
        alert "WARNING" "No database backups found"
        return 1
    fi
    
    # Check backup age
    local backup_age
    backup_age=$(find "$latest_backup" -mtime +1 2>/dev/null && echo "old" || echo "recent")
    
    if [[ "$backup_age" == "old" ]]; then
        alert "WARNING" "Latest backup is older than 24 hours: $latest_backup"
    else
        log "Backup status: OK (latest: $latest_backup)"
    fi
    
    return 0
}

# Generate infrastructure report
generate_infrastructure_report() {
    log "Generating infrastructure report"
    
    cat << EOF

=== ENTERPRISE CRM INFRASTRUCTURE REPORT ===
Generated: $(date)

DATABASE STATUS:
$(docker exec enterprise-postgres pg_isready -h localhost -p 5432 -U "$DB_USER" 2>/dev/null || echo "Database connection failed")

NGINX STATUS:
$(docker exec enterprise-nginx nginx -t 2>&1 | head -3)

SYSTEM RESOURCES:
CPU Load: $(uptime | awk -F'load average:' '{print $2}')
Memory: $(free -h | awk 'NR==2{printf "%s/%s (%.1f%%)", $3,$2,$3*100/$2}')
Disk: $(df -h / | awk 'NR==2{print $3"/"$2" ("$5")"}')

CONTAINER HEALTH:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}" --filter "name=enterprise")

RECENT ERRORS:
Nginx errors (last 10min): $(docker exec enterprise-nginx sh -c "find /var/log/nginx -name '*.log' -exec grep -h \"$(date -d '10 minutes ago' '+%d/%b/%Y:%H:%M')\" {} \; 2>/dev/null | grep -i error | wc -l" || echo "N/A")
API Gateway errors (last 10min): $(docker logs --since=10m enterprise-api-gateway 2>&1 | grep -i error | wc -l || echo "N/A")

EOF
}

# Main monitoring function
main() {
    log "Starting infrastructure monitoring"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    local exit_code=0
    
    # Load environment variables if .env exists
    if [[ -f "$PROJECT_DIR/.env" ]]; then
        # shellcheck source=/dev/null
        source "$PROJECT_DIR/.env"
    fi
    
    # Run all checks
    check_database || exit_code=1
    check_nginx || exit_code=1
    check_api_gateway || exit_code=1
    check_system_performance || exit_code=1
    check_backup_status || exit_code=1
    
    # Generate report
    generate_infrastructure_report
    
    if [[ $exit_code -eq 0 ]]; then
        log "Infrastructure monitoring completed successfully"
        echo -e "${GREEN}✓ Infrastructure monitoring completed successfully${NC}"
    else
        log "Infrastructure monitoring completed with warnings/errors"
        echo -e "${YELLOW}⚠ Infrastructure monitoring completed with warnings/errors${NC}"
    fi
    
    return $exit_code
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi