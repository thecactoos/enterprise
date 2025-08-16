#!/bin/bash

# Real-time Monitoring Dashboard for Enterprise CRM
# Provides live system status and metrics

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REFRESH_INTERVAL=5
DOMAIN="cactoos.digital"

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'
DIM='\033[2m'

# Unicode symbols
CHECK="✓"
CROSS="✗"
WARNING="⚠"
INFO="ℹ"
ARROW="→"
BULLET="•"

# Clear screen and move cursor to top
clear_screen() {
    clear
    tput cup 0 0
}

# Print header with system info
print_header() {
    local current_time
    current_time=$(date '+%Y-%m-%d %H:%M:%S %Z')
    
    echo -e "${CYAN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                    ENTERPRISE CRM MONITORING DASHBOARD                      ║"
    echo "║                              cactoos.digital                               ║"
    echo "╠══════════════════════════════════════════════════════════════════════════════╣"
    echo "║ Time: $current_time                                              ║"
    echo "║ Refresh: ${REFRESH_INTERVAL}s | Press 'q' to quit | Press 'r' to refresh now                    ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Get SSL certificate status
get_ssl_status() {
    local status_color="${RED}"
    local status_text="FAILED"
    local days_left="N/A"
    
    # Get certificate info
    local cert_info
    cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [[ -n "$cert_info" ]]; then
        local expiry_date
        expiry_date=$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)
        
        if [[ -n "$expiry_date" ]]; then
            local expiry_epoch current_epoch
            expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
            current_epoch=$(date +%s)
            
            if [[ $expiry_epoch -gt 0 ]]; then
                days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [[ $days_left -le 7 ]]; then
                    status_color="${RED}"
                    status_text="CRITICAL"
                elif [[ $days_left -le 30 ]]; then
                    status_color="${YELLOW}"
                    status_text="WARNING"
                else
                    status_color="${GREEN}"
                    status_text="OK"
                fi
            fi
        fi
    fi
    
    echo -e "${status_color}${status_text}${NC} (${days_left} days)"
}

# Get container status
get_container_status() {
    local containers=(
        "enterprise-postgres:Database"
        "enterprise-api-gateway:API Gateway"
        "enterprise-services-service:Services"
        "enterprise-quotes-service:Quotes"
        "enterprise-ocr-service:OCR"
        "enterprise-frontend:Frontend"
        "enterprise-nginx:Nginx"
    )
    
    local running=0
    local total=${#containers[@]}
    
    echo -e "${WHITE}${BOLD}Container Status:${NC}"
    
    for container_info in "${containers[@]}"; do
        local container_name="${container_info%:*}"
        local display_name="${container_info#*:}"
        
        local status
        status=$(docker inspect --format='{{.State.Status}}' "$container_name" 2>/dev/null || echo "not_found")
        
        local status_icon="${CROSS}"
        local status_color="${RED}"
        
        case $status in
            "running")
                status_icon="${CHECK}"
                status_color="${GREEN}"
                running=$((running + 1))
                
                # Get uptime
                local started_at
                started_at=$(docker inspect --format='{{.State.StartedAt}}' "$container_name" 2>/dev/null | cut -c1-19 || echo "")
                local uptime="N/A"
                
                if [[ -n "$started_at" ]]; then
                    local start_epoch
                    start_epoch=$(date -d "$started_at" +%s 2>/dev/null || echo "0")
                    if [[ $start_epoch -gt 0 ]]; then
                        local current_epoch
                        current_epoch=$(date +%s)
                        local uptime_seconds=$((current_epoch - start_epoch))
                        uptime=$(printf "%dd %02dh %02dm" $((uptime_seconds/86400)) $((uptime_seconds%86400/3600)) $((uptime_seconds%3600/60)))
                    fi
                fi
                
                echo -e "  ${status_color}${status_icon} ${display_name}${NC} ${DIM}(${uptime})${NC}"
                ;;
            "restarting")
                status_icon="${WARNING}"
                status_color="${YELLOW}"
                echo -e "  ${status_color}${status_icon} ${display_name}${NC} ${DIM}(restarting)${NC}"
                ;;
            *)
                echo -e "  ${status_color}${status_icon} ${display_name}${NC} ${DIM}(${status})${NC}"
                ;;
        esac
    done
    
    echo -e "\nRunning: ${running}/${total} containers"
}

# Get web endpoint status
get_web_status() {
    local endpoints=(
        "https://$DOMAIN/:Homepage"
        "https://$DOMAIN/api/health:API Health"
    )
    
    echo -e "\n${WHITE}${BOLD}Web Endpoints:${NC}"
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local name="${endpoint_info#*:}"
        
        local start_time
        start_time=$(date +%s.%N)
        
        local http_code
        http_code=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$endpoint" 2>/dev/null || echo "000")
        
        local end_time
        end_time=$(date +%s.%N)
        
        local response_time
        response_time=$(echo "($end_time - $start_time) * 1000" | bc | cut -d. -f1)
        
        local status_icon="${CROSS}"
        local status_color="${RED}"
        local status_text="FAILED"
        
        if [[ "$http_code" == "200" ]]; then
            status_icon="${CHECK}"
            status_color="${GREEN}"
            status_text="OK"
            
            if [[ $response_time -gt 3000 ]]; then
                status_color="${YELLOW}"
                status_text="SLOW"
            fi
        elif [[ "$http_code" != "000" ]]; then
            status_text="HTTP $http_code"
        fi
        
        echo -e "  ${status_color}${status_icon} ${name}${NC} ${DIM}(${response_time}ms)${NC}"
    done
}

# Get system resources
get_system_resources() {
    echo -e "\n${WHITE}${BOLD}System Resources:${NC}"
    
    # CPU Load
    local load_avg
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores
    cpu_cores=$(nproc)
    
    local load_status="${GREEN}${CHECK}"
    if (( $(echo "$load_avg > $cpu_cores" | bc -l) )); then
        load_status="${RED}${CROSS}"
    elif (( $(echo "$load_avg > $(echo "$cpu_cores * 0.7" | bc)" | bc -l) )); then
        load_status="${YELLOW}${WARNING}"
    fi
    
    echo -e "  ${load_status} CPU Load:${NC} $load_avg ${DIM}(cores: $cpu_cores)${NC}"
    
    # Memory
    local mem_info
    read -r mem_total mem_used mem_available < <(free -m | awk 'NR==2{print $2, $3, $7}')
    local mem_percent=$((mem_used * 100 / mem_total))
    
    local mem_status="${GREEN}${CHECK}"
    if [[ $mem_percent -gt 85 ]]; then
        mem_status="${RED}${CROSS}"
    elif [[ $mem_percent -gt 70 ]]; then
        mem_status="${YELLOW}${WARNING}"
    fi
    
    echo -e "  ${mem_status} Memory:${NC} ${mem_used}MB/${mem_total}MB ${DIM}(${mem_percent}%)${NC}"
    
    # Disk
    local disk_info
    read -r disk_used disk_total disk_percent < <(df -h / | awk 'NR==2{print $3, $2, $5}')
    local disk_percent_num=$(echo "$disk_percent" | sed 's/%//')
    
    local disk_status="${GREEN}${CHECK}"
    if [[ $disk_percent_num -gt 85 ]]; then
        disk_status="${RED}${CROSS}"
    elif [[ $disk_percent_num -gt 70 ]]; then
        disk_status="${YELLOW}${WARNING}"
    fi
    
    echo -e "  ${disk_status} Disk:${NC} ${disk_used}/${disk_total} ${DIM}(${disk_percent})${NC}"
}

# Get database status
get_database_status() {
    echo -e "\n${WHITE}${BOLD}Database Status:${NC}"
    
    local db_status="${RED}${CROSS}"
    local db_text="DISCONNECTED"
    local connections="N/A"
    local db_size="N/A"
    
    if docker exec enterprise-postgres pg_isready >/dev/null 2>&1; then
        db_status="${GREEN}${CHECK}"
        db_text="CONNECTED"
        
        # Get connection count and database size
        local db_stats
        db_stats=$(docker exec enterprise-postgres psql -U postgres -d enterprise_crm -t -c "
            SELECT 
                (SELECT count(*) FROM pg_stat_activity WHERE datname='enterprise_crm') as connections,
                pg_size_pretty(pg_database_size('enterprise_crm')) as db_size;
        " 2>/dev/null || echo "")
        
        if [[ -n "$db_stats" ]]; then
            read -r connections db_size <<< "$db_stats"
            connections=$(echo "$connections" | xargs)
            db_size=$(echo "$db_size" | xargs)
        fi
    fi
    
    echo -e "  ${db_status} PostgreSQL:${NC} $db_text"
    echo -e "  ${BULLET} Active Connections: $connections"
    echo -e "  ${BULLET} Database Size: $db_size"
}

# Get recent alerts and errors
get_recent_alerts() {
    echo -e "\n${WHITE}${BOLD}Recent Issues (Last 1 Hour):${NC}"
    
    local alert_count=0
    local log_files=(
        "/var/log/ssl-monitor.log"
        "/var/log/container-health.log"  
        "/var/log/infrastructure-monitor.log"
        "/var/log/alert-manager.log"
    )
    
    local one_hour_ago
    one_hour_ago=$(date -d '1 hour ago' '+%Y-%m-%d %H:%M:%S')
    
    for log_file in "${log_files[@]}"; do
        if [[ -f "$log_file" ]]; then
            local recent_alerts
            recent_alerts=$(awk -v start="$one_hour_ago" '$0 >= start && (/CRITICAL\]/ || /WARNING\]/ || /ERROR\]/)' "$log_file" 2>/dev/null | tail -5)
            
            if [[ -n "$recent_alerts" ]]; then
                while IFS= read -r line; do
                    local severity="INFO"
                    local line_color="${BLUE}"
                    
                    if echo "$line" | grep -q "CRITICAL"; then
                        severity="CRITICAL"
                        line_color="${RED}"
                    elif echo "$line" | grep -q "WARNING"; then
                        severity="WARNING"  
                        line_color="${YELLOW}"
                    elif echo "$line" | grep -q "ERROR"; then
                        severity="ERROR"
                        line_color="${RED}"
                    fi
                    
                    local timestamp
                    timestamp=$(echo "$line" | grep -o '^[0-9-]* [0-9:]*' || echo "")
                    local message
                    message=$(echo "$line" | sed 's/^[0-9-]* [0-9:]* - //' | cut -c1-60)
                    
                    echo -e "  ${line_color}${BULLET} ${severity}:${NC} ${DIM}${timestamp}${NC} $message"
                    alert_count=$((alert_count + 1))
                done <<< "$recent_alerts"
            fi
        fi
    done
    
    if [[ $alert_count -eq 0 ]]; then
        echo -e "  ${GREEN}${CHECK} No recent issues${NC}"
    fi
}

# Get performance metrics
get_performance_metrics() {
    echo -e "\n${WHITE}${BOLD}Performance Metrics:${NC}"
    
    # Docker stats for running containers
    local stats
    stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}" 2>/dev/null | grep enterprise | head -5)
    
    if [[ -n "$stats" ]]; then
        echo -e "  ${DIM}Container Performance:${NC}"
        while IFS=$'\t' read -r container cpu_perc mem_perc; do
            local short_name
            short_name=$(echo "$container" | sed 's/enterprise-//' | cut -c1-12)
            
            local cpu_num mem_num
            cpu_num=$(echo "$cpu_perc" | sed 's/%//' | cut -d. -f1)
            mem_num=$(echo "$mem_perc" | sed 's/%//' | cut -d. -f1)
            
            local cpu_color="${GREEN}"
            local mem_color="${GREEN}"
            
            [[ $cpu_num -gt 50 ]] && cpu_color="${YELLOW}"
            [[ $cpu_num -gt 80 ]] && cpu_color="${RED}"
            [[ $mem_num -gt 50 ]] && mem_color="${YELLOW}"
            [[ $mem_num -gt 80 ]] && mem_color="${RED}"
            
            echo -e "    ${BULLET} $short_name: CPU ${cpu_color}${cpu_perc}${NC} MEM ${mem_color}${mem_perc}${NC}"
        done <<< "$stats"
    fi
    
    # Network connectivity test
    local network_status="${GREEN}${CHECK}"
    if ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        network_status="${RED}${CROSS}"
    fi
    echo -e "  ${network_status} Network Connectivity${NC}"
}

# Main dashboard display
display_dashboard() {
    clear_screen
    print_header
    
    echo -e "\n${CYAN}${BOLD}SSL Certificate:${NC} $(get_ssl_status)"
    echo ""
    
    get_container_status
    get_web_status
    get_system_resources
    get_database_status
    get_recent_alerts
    get_performance_metrics
    
    echo -e "\n${DIM}Last updated: $(date '+%H:%M:%S')${NC}"
    echo -e "${DIM}Press 'q' to quit, 'r' to refresh, or wait ${REFRESH_INTERVAL}s for auto-refresh${NC}"
}

# Interactive mode
interactive_mode() {
    local running=true
    
    # Set up non-blocking input
    if command -v stty >/dev/null 2>&1; then
        stty -echo -icanon time 0 min 0
    fi
    
    while $running; do
        display_dashboard
        
        # Wait for refresh interval or user input
        local count=0
        while [[ $count -lt $REFRESH_INTERVAL ]]; do
            local input
            if command -v read >/dev/null 2>&1; then
                read -t 1 -n 1 input 2>/dev/null || input=""
            else
                sleep 1
                input=""
            fi
            
            case $input in
                'q'|'Q')
                    running=false
                    break
                    ;;
                'r'|'R')
                    break
                    ;;
                *)
                    count=$((count + 1))
                    ;;
            esac
        done
    done
    
    # Restore terminal settings
    if command -v stty >/dev/null 2>&1; then
        stty echo icanon
    fi
    
    clear_screen
    echo -e "${GREEN}Dashboard closed.${NC}"
}

# Static mode (single display)
static_mode() {
    display_dashboard
}

# Main function
main() {
    local mode="${1:-interactive}"
    
    case $mode in
        "interactive"|"i"|"")
            interactive_mode
            ;;
        "static"|"s")
            static_mode
            ;;
        "once"|"o")
            static_mode
            ;;
        "--help"|"-h")
            echo "Enterprise CRM Monitoring Dashboard"
            echo ""
            echo "Usage: $0 [mode]"
            echo ""
            echo "Modes:"
            echo "  interactive  - Live updating dashboard (default)"
            echo "  static       - Single display, no updates"
            echo "  once         - Same as static"
            echo ""
            echo "Interactive controls:"
            echo "  q - Quit"
            echo "  r - Refresh now"
            echo ""
            ;;
        *)
            echo "Invalid mode: $mode"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
}

# Handle cleanup on exit
cleanup() {
    if command -v stty >/dev/null 2>&1; then
        stty echo icanon 2>/dev/null || true
    fi
    clear_screen
}

trap cleanup EXIT INT TERM

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi