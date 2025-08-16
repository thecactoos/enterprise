#!/bin/bash
# 🚀 Pre-deployment Hook - Enterprise CRM
# Validates system health before any deployment changes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="cactoos.digital"
API_BASE="https://${DOMAIN}/api"
TIMEOUT=10
RETRY_COUNT=3

echo -e "${BLUE}🔍 PRE-DEPLOYMENT VALIDATION - $(date)${NC}"
echo "=========================================="

# Function to make HTTP requests with retries
http_check() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -e "${YELLOW}Checking: ${description}${NC}"
    
    for i in $(seq 1 $RETRY_COUNT); do
        if response=$(curl -s -w "%{http_code}" --max-time $TIMEOUT "$url" -o /tmp/response_body 2>/dev/null); then
            status_code="${response: -3}"
            if [ "$status_code" = "$expected_status" ]; then
                echo -e "  ${GREEN}✅ OK (${status_code}) - Attempt $i${NC}"
                return 0
            else
                echo -e "  ${YELLOW}⚠️  HTTP $status_code - Attempt $i${NC}"
            fi
        else
            echo -e "  ${RED}❌ Connection failed - Attempt $i${NC}"
        fi
        
        if [ $i -lt $RETRY_COUNT ]; then
            sleep 2
        fi
    done
    
    echo -e "  ${RED}❌ FAILED after $RETRY_COUNT attempts${NC}"
    return 1
}

# Function to check SSL certificate
check_ssl() {
    echo -e "${YELLOW}Checking: SSL Certificate Status${NC}"
    
    if openssl s_client -servername $DOMAIN -connect $DOMAIN:443 </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        echo -e "  ${GREEN}✅ SSL Certificate valid${NC}"
        
        # Check expiry
        expiry_date=$(openssl s_client -servername $DOMAIN -connect $DOMAIN:443 </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
        current_epoch=$(date +%s)
        days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ $days_left -gt 30 ]; then
            echo -e "  ${GREEN}✅ Certificate expires in $days_left days${NC}"
        elif [ $days_left -gt 0 ]; then
            echo -e "  ${YELLOW}⚠️  Certificate expires in $days_left days${NC}"
        else
            echo -e "  ${RED}❌ Certificate expired!${NC}"
            return 1
        fi
    else
        echo -e "  ${RED}❌ SSL Certificate check failed${NC}"
        return 1
    fi
}

# Function to check database connectivity
check_database() {
    echo -e "${YELLOW}Checking: Database Connectivity${NC}"
    
    if docker exec enterprise-postgres-dev pg_isready -U postgres >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PostgreSQL is ready${NC}"
        
        # Check database size and connections
        if db_stats=$(docker exec enterprise-postgres-dev psql -U postgres -d enterprise_crm -t -c "SELECT pg_database_size(current_database()), numbackends FROM pg_stat_database WHERE datname=current_database();" 2>/dev/null); then
            db_size=$(echo $db_stats | awk '{print $1}')
            connections=$(echo $db_stats | awk '{print $2}')
            echo -e "  ${GREEN}✅ Database size: $(numfmt --to=iec $db_size), Active connections: $connections${NC}"
        fi
    else
        echo -e "  ${RED}❌ PostgreSQL not ready${NC}"
        return 1
    fi
}

# Function to check Docker containers
check_containers() {
    echo -e "${YELLOW}Checking: Docker Container Health${NC}"
    
    # Check critical containers
    critical_containers=("enterprise-postgres-dev" "enterprise-nginx-ssl")
    
    for container in "${critical_containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" --format "{{.Names}}" | grep -q "$container"; then
            echo -e "  ${GREEN}✅ $container is running${NC}"
        else
            echo -e "  ${RED}❌ $container is not running${NC}"
            return 1
        fi
    done
    
    # Check service containers (non-critical, just report)
    service_containers=$(docker ps --filter "name=enterprise-.*-service-dev" --format "{{.Names}}" | wc -l)
    echo -e "  ${GREEN}ℹ️  $service_containers microservices running${NC}"
}

# Function to check system resources
check_resources() {
    echo -e "${YELLOW}Checking: System Resources${NC}"
    
    # Check disk space
    disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $disk_usage -lt 80 ]; then
        echo -e "  ${GREEN}✅ Disk usage: ${disk_usage}%${NC}"
    elif [ $disk_usage -lt 90 ]; then
        echo -e "  ${YELLOW}⚠️  Disk usage: ${disk_usage}%${NC}"
    else
        echo -e "  ${RED}❌ Disk usage critical: ${disk_usage}%${NC}"
        return 1
    fi
    
    # Check memory
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $mem_usage -lt 80 ]; then
        echo -e "  ${GREEN}✅ Memory usage: ${mem_usage}%${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Memory usage: ${mem_usage}%${NC}"
    fi
    
    # Check load average
    load_avg=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
    echo -e "  ${GREEN}ℹ️  Load average: $load_avg${NC}"
}

# Function to update production status
update_production_status() {
    echo -e "${YELLOW}Updating: Production Status Documentation${NC}"
    
    # Get current metrics
    cpu_load=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
    mem_usage=$(free | grep Mem | awk '{printf "%.1f/%.1fGB (%.0f%%)", $3/1024/1024, $2/1024/1024, $3/$2 * 100.0}')
    uptime_info=$(uptime -p)
    
    # Create timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    
    # Update key metrics in PRODUCTION-STATUS.md (simplified)
    if [ -f "PRODUCTION-STATUS.md" ]; then
        # This would typically update specific sections
        echo -e "  ${GREEN}✅ Would update production status with current metrics${NC}"
        echo -e "     CPU Load: $cpu_load, Memory: $mem_usage"
        echo -e "     Uptime: $uptime_info"
    fi
}

# Main validation sequence
main() {
    local exit_code=0
    
    echo -e "${BLUE}1. INFRASTRUCTURE CHECKS${NC}"
    echo "------------------------"
    
    # SSL and HTTPS checks
    if ! check_ssl; then
        exit_code=1
    fi
    
    # Nginx health check
    if ! http_check "https://${DOMAIN}/nginx/health" "Nginx Health Endpoint"; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}2. APPLICATION CHECKS${NC}"
    echo "--------------------"
    
    # API Gateway health
    if ! http_check "${API_BASE}/health" "API Gateway Health"; then
        exit_code=1
    fi
    
    # Frontend availability
    if ! http_check "https://${DOMAIN}/" "Frontend Application" 200; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}3. INFRASTRUCTURE HEALTH${NC}"
    echo "------------------------"
    
    # Database connectivity
    if ! check_database; then
        exit_code=1
    fi
    
    # Container health
    if ! check_containers; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}4. SYSTEM RESOURCES${NC}"
    echo "------------------"
    
    # System resource checks
    if ! check_resources; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}5. DOCUMENTATION UPDATE${NC}"
    echo "-------------------------"
    
    # Update production status
    update_production_status
    
    # Final result
    echo ""
    echo "=========================================="
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 PRE-DEPLOYMENT VALIDATION PASSED${NC}"
        echo -e "${GREEN}✅ System is ready for deployment${NC}"
        echo -e "${GREEN}✅ All critical systems operational${NC}"
        echo -e "${GREEN}✅ Production URL: https://${DOMAIN}${NC}"
    else
        echo -e "${RED}❌ PRE-DEPLOYMENT VALIDATION FAILED${NC}"
        echo -e "${RED}⚠️  Fix issues before deploying${NC}"
        echo -e "${YELLOW}📋 Check logs above for specific failures${NC}"
    fi
    echo ""
    
    return $exit_code
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Pre-deployment validation hook for Enterprise CRM"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --quiet, -q   Minimal output"
        echo "  --verbose, -v Detailed output"
        echo ""
        echo "This script validates:"
        echo "- SSL certificate status and expiry"
        echo "- Application health endpoints"
        echo "- Database connectivity"
        echo "- Container health"
        echo "- System resources"
        exit 0
        ;;
    --quiet|-q)
        # Redirect output for quiet mode
        main >/dev/null 2>&1
        exit $?
        ;;
    --verbose|-v)
        set -x
        main
        exit $?
        ;;
    *)
        main
        exit $?
        ;;
esac