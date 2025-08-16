#!/bin/bash

# Comprehensive System Monitoring Script
# Orchestrates all monitoring components and provides centralized status

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/var/www/enterprise"
LOG_FILE="/var/log/system-monitor.log"
STATUS_FILE="/var/log/system-status.json"
ALERT_EMAIL=""  # Set this if you want email alerts
WEBHOOK_URL=""  # Set this for Slack/Discord notifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Monitoring scripts
MONITORING_SCRIPTS=(
    "$SCRIPT_DIR/ssl-monitor.sh"
    "$SCRIPT_DIR/container-health-monitor.sh"
    "$SCRIPT_DIR/infrastructure-monitor.sh"
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
            -d "{\"text\":\"[$level] System Monitor - $message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$level] System Monitor Alert" "$ALERT_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Check if monitoring scripts exist and are executable
check_monitoring_scripts() {
    log "Checking monitoring scripts"
    
    local missing_scripts=()
    
    for script in "${MONITORING_SCRIPTS[@]}"; do
        if [[ ! -f "$script" ]]; then
            missing_scripts+=("$script")
        elif [[ ! -x "$script" ]]; then
            chmod +x "$script"
            log "Made $script executable"
        fi
    done
    
    if [[ ${#missing_scripts[@]} -gt 0 ]]; then
        alert "CRITICAL" "Missing monitoring scripts: ${missing_scripts[*]}"
        return 1
    fi
    
    log "All monitoring scripts found and executable"
    return 0
}

# Run individual monitoring script
run_monitoring_script() {
    local script=$1
    local script_name
    script_name=$(basename "$script" .sh)
    
    log "Running $script_name monitoring"
    
    local start_time
    start_time=$(date +%s)
    
    local exit_code=0
    local output
    
    # Run script and capture output
    if output=$("$script" 2>&1); then
        log "$script_name completed successfully"
    else
        exit_code=$?
        log "$script_name completed with exit code $exit_code"
    fi
    
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log "$script_name execution time: ${duration}s"
    
    # Update status
    update_script_status "$script_name" $exit_code "$duration" "$output"
    
    return $exit_code
}

# Update script status in JSON file
update_script_status() {
    local script_name=$1
    local exit_code=$2
    local duration=$3
    local output=$4
    
    local status="OK"
    [[ $exit_code -ne 0 ]] && status="ERROR"
    
    local timestamp
    timestamp=$(date -Iseconds)
    
    # Create or update status file
    if [[ ! -f "$STATUS_FILE" ]]; then
        echo '{}' > "$STATUS_FILE"
    fi
    
    # Update status using jq if available, otherwise simple append
    if command -v jq >/dev/null 2>&1; then
        local temp_file
        temp_file=$(mktemp)
        
        jq --arg name "$script_name" \
           --arg status "$status" \
           --argjson exit_code "$exit_code" \
           --argjson duration "$duration" \
           --arg timestamp "$timestamp" \
           --arg output "$output" \
           '.[$name] = {
               "status": $status,
               "exit_code": $exit_code,
               "duration": $duration,
               "timestamp": $timestamp,
               "output": $output
           }' "$STATUS_FILE" > "$temp_file" && mv "$temp_file" "$STATUS_FILE"
    else
        log "jq not available, status file update skipped"
    fi
}

# Generate system status report
generate_status_report() {
    log "Generating system status report"
    
    echo -e "\n${CYAN}=== ENTERPRISE CRM SYSTEM STATUS ===${NC}"
    echo -e "Generated: $(date)"
    echo -e "Domain: ${BLUE}cactoos.digital${NC}"
    echo ""
    
    # Overall system health
    local overall_status="HEALTHY"
    local critical_issues=0
    local warnings=0
    
    # Check SSL certificate
    echo -e "${YELLOW}SSL Certificate Status:${NC}"
    local ssl_days
    ssl_days=$(echo | openssl s_client -servername cactoos.digital -connect cactoos.digital:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null | grep "notAfter=" | cut -d= -f2)
    if [[ -n "$ssl_days" ]]; then
        local expiry_epoch current_epoch days_left
        expiry_epoch=$(date -d "$ssl_days" +%s 2>/dev/null || echo "0")
        current_epoch=$(date +%s)
        
        if [[ $expiry_epoch -gt 0 ]]; then
            days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
            if [[ $days_left -le 7 ]]; then
                echo -e "  ${RED}✗ Certificate expires in $days_left days${NC}"
                critical_issues=$((critical_issues + 1))
                overall_status="CRITICAL"
            elif [[ $days_left -le 30 ]]; then
                echo -e "  ${YELLOW}⚠ Certificate expires in $days_left days${NC}"
                warnings=$((warnings + 1))
                [[ "$overall_status" == "HEALTHY" ]] && overall_status="WARNING"
            else
                echo -e "  ${GREEN}✓ Certificate valid for $days_left days${NC}"
            fi
        else
            echo -e "  ${RED}✗ Failed to parse certificate expiry${NC}"
            critical_issues=$((critical_issues + 1))
            overall_status="CRITICAL"
        fi
    else
        echo -e "  ${RED}✗ Failed to retrieve certificate${NC}"
        critical_issues=$((critical_issues + 1))
        overall_status="CRITICAL"
    fi
    
    # Check containers
    echo -e "\n${YELLOW}Container Status:${NC}"
    local containers=(
        "enterprise-postgres"
        "enterprise-api-gateway"
        "enterprise-services-service"
        "enterprise-quotes-service"
        "enterprise-ocr-service"
        "enterprise-frontend"
        "enterprise-nginx"
    )
    
    for container in "${containers[@]}"; do
        local status
        status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
        
        case $status in
            "running")
                echo -e "  ${GREEN}✓ $container${NC}"
                ;;
            *)
                echo -e "  ${RED}✗ $container ($status)${NC}"
                critical_issues=$((critical_issues + 1))
                overall_status="CRITICAL"
                ;;
        esac
    done
    
    # Check web endpoints
    echo -e "\n${YELLOW}Web Endpoints:${NC}"
    local endpoints=(
        "https://cactoos.digital/:Homepage"
        "https://cactoos.digital/api/health:API Health"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local name="${endpoint_info#*:}"
        
        local response_time http_code
        response_time=$(curl -s -w "%{time_total}" -o /dev/null --max-time 10 "$endpoint" 2>/dev/null || echo "timeout")
        http_code=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$endpoint" 2>/dev/null || echo "000")
        
        if [[ "$response_time" == "timeout" ]]; then
            echo -e "  ${RED}✗ $name (timeout)${NC}"
            critical_issues=$((critical_issues + 1))
            overall_status="CRITICAL"
        elif [[ "$http_code" != "200" ]]; then
            echo -e "  ${RED}✗ $name (HTTP $http_code)${NC}"
            critical_issues=$((critical_issues + 1))
            overall_status="CRITICAL"
        else
            local response_ms
            response_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
            if [[ $response_ms -gt 3000 ]]; then
                echo -e "  ${YELLOW}⚠ $name (${response_ms}ms)${NC}"
                warnings=$((warnings + 1))
                [[ "$overall_status" == "HEALTHY" ]] && overall_status="WARNING"
            else
                echo -e "  ${GREEN}✓ $name (${response_ms}ms)${NC}"
            fi
        fi
    done
    
    # System resources
    echo -e "\n${YELLOW}System Resources:${NC}"
    local load_avg mem_usage disk_usage
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    mem_usage=$(free -m | awk 'NR==2{printf "%.1f", $3*100/$2}')
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    echo -e "  Load Average: $load_avg"
    
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        echo -e "  ${RED}✗ Memory Usage: ${mem_usage}%${NC}"
        critical_issues=$((critical_issues + 1))
        overall_status="CRITICAL"
    elif (( $(echo "$mem_usage > 70" | bc -l) )); then
        echo -e "  ${YELLOW}⚠ Memory Usage: ${mem_usage}%${NC}"
        warnings=$((warnings + 1))
        [[ "$overall_status" == "HEALTHY" ]] && overall_status="WARNING"
    else
        echo -e "  ${GREEN}✓ Memory Usage: ${mem_usage}%${NC}"
    fi
    
    if [[ $disk_usage -gt 85 ]]; then
        echo -e "  ${RED}✗ Disk Usage: ${disk_usage}%${NC}"
        critical_issues=$((critical_issues + 1))
        overall_status="CRITICAL"
    elif [[ $disk_usage -gt 70 ]]; then
        echo -e "  ${YELLOW}⚠ Disk Usage: ${disk_usage}%${NC}"
        warnings=$((warnings + 1))
        [[ "$overall_status" == "HEALTHY" ]] && overall_status="WARNING"
    else
        echo -e "  ${GREEN}✓ Disk Usage: ${disk_usage}%${NC}"
    fi
    
    # Overall status
    echo -e "\n${YELLOW}Overall Status:${NC}"
    case $overall_status in
        "HEALTHY")
            echo -e "  ${GREEN}✓ SYSTEM HEALTHY${NC}"
            ;;
        "WARNING")
            echo -e "  ${YELLOW}⚠ SYSTEM WARNING ($warnings issues)${NC}"
            ;;
        "CRITICAL")
            echo -e "  ${RED}✗ SYSTEM CRITICAL ($critical_issues critical issues)${NC}"
            ;;
    esac
    
    echo ""
    
    # Return appropriate exit code
    case $overall_status in
        "HEALTHY") return 0 ;;
        "WARNING") return 1 ;;
        "CRITICAL") return 2 ;;
    esac
}

# Quick status check (minimal output)
quick_status() {
    local status_color="${RED}"
    local status_text="CRITICAL"
    
    # Check critical components quickly
    local checks_passed=0
    local total_checks=4
    
    # SSL check
    if echo | openssl s_client -servername cactoos.digital -connect cactoos.digital:443 >/dev/null 2>&1; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Container check
    if docker ps --format '{{.Names}}' | grep -q "enterprise-nginx\|enterprise-api-gateway"; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Web endpoint check
    if curl -s --max-time 5 "https://cactoos.digital" >/dev/null 2>&1; then
        checks_passed=$((checks_passed + 1))
    fi
    
    # Database check
    if docker exec enterprise-postgres pg_isready >/dev/null 2>&1; then
        checks_passed=$((checks_passed + 1))
    fi
    
    if [[ $checks_passed -eq $total_checks ]]; then
        status_color="${GREEN}"
        status_text="HEALTHY"
    elif [[ $checks_passed -ge 3 ]]; then
        status_color="${YELLOW}"
        status_text="WARNING"
    fi
    
    echo -e "${status_color}System Status: $status_text ($checks_passed/$total_checks checks passed)${NC}"
}

# Main monitoring function
main() {
    local mode="${1:-full}"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "$(dirname "$STATUS_FILE")"
    
    case $mode in
        "quick"|"q")
            quick_status
            return $?
            ;;
        "status"|"s")
            generate_status_report
            return $?
            ;;
        "full"|"f"|"")
            log "Starting comprehensive system monitoring"
            
            # Check monitoring scripts
            if ! check_monitoring_scripts; then
                alert "CRITICAL" "Failed to verify monitoring scripts"
                return 1
            fi
            
            local exit_code=0
            
            # Run all monitoring scripts
            for script in "${MONITORING_SCRIPTS[@]}"; do
                if ! run_monitoring_script "$script"; then
                    exit_code=1
                fi
            done
            
            # Generate status report
            generate_status_report
            local status_exit=$?
            [[ $status_exit -gt $exit_code ]] && exit_code=$status_exit
            
            if [[ $exit_code -eq 0 ]]; then
                log "System monitoring completed successfully"
                alert "INFO" "System monitoring completed - all systems healthy"
            elif [[ $exit_code -eq 1 ]]; then
                log "System monitoring completed with warnings"
                alert "WARNING" "System monitoring completed with warnings"
            else
                log "System monitoring found critical issues"
                alert "CRITICAL" "System monitoring found critical issues"
            fi
            
            return $exit_code
            ;;
        *)
            echo "Usage: $0 [full|quick|status]"
            echo "  full   - Run all monitoring checks (default)"
            echo "  quick  - Quick health check"
            echo "  status - Generate status report only"
            return 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi