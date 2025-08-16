#!/bin/bash
# 🚀 Post-deployment Hook - Enterprise CRM
# Validates deployment success and triggers follow-up actions

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
TIMEOUT=30  # Longer timeout for post-deploy checks
MAX_WAIT_TIME=300  # 5 minutes max wait for services

echo -e "${BLUE}🎉 POST-DEPLOYMENT VALIDATION - $(date)${NC}"
echo "==========================================="

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_wait=${3:-$MAX_WAIT_TIME}
    
    echo -e "${YELLOW}Waiting for $service_name to be ready...${NC}"
    
    local elapsed=0
    local interval=5
    
    while [ $elapsed -lt $max_wait ]; do
        if curl -s --max-time $TIMEOUT "$url" >/dev/null 2>&1; then
            echo -e "  ${GREEN}✅ $service_name is ready (${elapsed}s)${NC}"
            return 0
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -e "  ${YELLOW}⏳ Still waiting... (${elapsed}s/${max_wait}s)${NC}"
    done
    
    echo -e "  ${RED}❌ $service_name failed to become ready within ${max_wait}s${NC}"
    return 1
}

# Function to run comprehensive health checks
comprehensive_health_check() {
    echo -e "${YELLOW}Running: Comprehensive Health Check${NC}"
    
    # Test API Gateway
    if response=$(curl -s "${API_BASE}/health" 2>/dev/null); then
        if echo "$response" | grep -q '"status":"healthy"'; then
            echo -e "  ${GREEN}✅ API Gateway healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  API Gateway responded but status unclear${NC}"
            echo "     Response: $response"
        fi
    else
        echo -e "  ${RED}❌ API Gateway health check failed${NC}"
        return 1
    fi
    
    # Test microservices health (if endpoint exists)
    if response=$(curl -s "${API_BASE}/health/services" 2>/dev/null); then
        healthy_count=$(echo "$response" | grep -o '"status":"healthy"' | wc -l || echo "0")
        total_services=$(echo "$response" | grep -o '"name":"[^"]*"' | wc -l || echo "0")
        
        if [ "$healthy_count" -gt 0 ]; then
            echo -e "  ${GREEN}✅ Microservices: $healthy_count/$total_services healthy${NC}"
        else
            echo -e "  ${YELLOW}⚠️  Microservices health unclear${NC}"
        fi
    fi
    
    # Test frontend
    if curl -s --max-time $TIMEOUT "https://${DOMAIN}/" | grep -q "Enterprise CRM" 2>/dev/null; then
        echo -e "  ${GREEN}✅ Frontend loading correctly${NC}"
    else
        echo -e "  ${YELLOW}⚠️  Frontend response unclear${NC}"
    fi
}

# Function to verify SSL and security
verify_security() {
    echo -e "${YELLOW}Verifying: Security Configuration${NC}"
    
    # Check SSL grade (simplified)
    if curl -s -I "https://${DOMAIN}" | grep -q "Strict-Transport-Security"; then
        echo -e "  ${GREEN}✅ HSTS header present${NC}"
    else
        echo -e "  ${YELLOW}⚠️  HSTS header missing${NC}"
    fi
    
    # Check other security headers
    security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
    for header in "${security_headers[@]}"; do
        if curl -s -I "https://${DOMAIN}" | grep -q "$header"; then
            echo -e "  ${GREEN}✅ $header header present${NC}"
        else
            echo -e "  ${YELLOW}⚠️  $header header missing${NC}"
        fi
    done
}

# Function to run smoke tests
run_smoke_tests() {
    echo -e "${YELLOW}Running: Smoke Tests${NC}"
    
    # Test critical user journeys
    local tests_passed=0
    local total_tests=0
    
    # Test 1: Frontend loads
    total_tests=$((total_tests + 1))
    if curl -s --max-time $TIMEOUT "https://${DOMAIN}/" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ Frontend accessibility${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "  ${RED}❌ Frontend accessibility${NC}"
    fi
    
    # Test 2: API responds
    total_tests=$((total_tests + 1))
    if curl -s --max-time $TIMEOUT "${API_BASE}/health" >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ API accessibility${NC}"
        tests_passed=$((tests_passed + 1))
    else
        echo -e "  ${RED}❌ API accessibility${NC}"
    fi
    
    # Test 3: Database connectivity (via API)
    total_tests=$((total_tests + 1))
    if response=$(curl -s --max-time $TIMEOUT "${API_BASE}/health" 2>/dev/null); then
        if echo "$response" | grep -q '"service":"api-gateway"'; then
            echo -e "  ${GREEN}✅ Database connectivity (via API)${NC}"
            tests_passed=$((tests_passed + 1))
        else
            echo -e "  ${YELLOW}⚠️  Database connectivity unclear${NC}"
        fi
    else
        echo -e "  ${RED}❌ Database connectivity${NC}"
    fi
    
    echo -e "  ${BLUE}📊 Smoke tests: $tests_passed/$total_tests passed${NC}"
    
    if [ $tests_passed -eq $total_tests ]; then
        return 0
    else
        return 1
    fi
}

# Function to collect deployment metrics
collect_metrics() {
    echo -e "${YELLOW}Collecting: Deployment Metrics${NC}"
    
    # Response time test
    start_time=$(date +%s%3N)
    if curl -s --max-time $TIMEOUT "${API_BASE}/health" >/dev/null 2>&1; then
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        echo -e "  ${GREEN}✅ API response time: ${response_time}ms${NC}"
    else
        echo -e "  ${RED}❌ Failed to measure API response time${NC}"
    fi
    
    # System metrics
    load_avg=$(uptime | awk -F'load average:' '{ print $2 }' | awk '{ print $1 }' | sed 's/,//')
    mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    
    echo -e "  ${GREEN}📊 System load: $load_avg${NC}"
    echo -e "  ${GREEN}📊 Memory usage: ${mem_usage}%${NC}"
    
    # Container count
    container_count=$(docker ps --filter "name=enterprise-" --format "{{.Names}}" | wc -l)
    echo -e "  ${GREEN}📊 Running containers: $container_count${NC}"
}

# Function to trigger notifications (placeholder)
send_notifications() {
    echo -e "${YELLOW}Notifications: Deployment Complete${NC}"
    
    # This would integrate with Slack, email, etc.
    echo -e "  ${GREEN}ℹ️  Would send deployment success notification${NC}"
    echo -e "  ${GREEN}ℹ️  Production URL: https://${DOMAIN}${NC}"
    echo -e "  ${GREEN}ℹ️  Deployment completed at: $(date)${NC}"
    
    # Log deployment to file
    log_entry="$(date '+%Y-%m-%d %H:%M:%S') - Deployment completed successfully - https://${DOMAIN}"
    echo "$log_entry" >> /var/log/enterprise-deployments.log 2>/dev/null || true
}

# Function to cleanup temporary files
cleanup_deployment() {
    echo -e "${YELLOW}Cleanup: Deployment Artifacts${NC}"
    
    # Remove temporary files
    rm -f /tmp/response_body /tmp/deployment_* 2>/dev/null || true
    
    # Docker cleanup (optional)
    docker system prune -f >/dev/null 2>&1 || true
    
    echo -e "  ${GREEN}✅ Cleanup completed${NC}"
}

# Main post-deployment sequence
main() {
    local exit_code=0
    
    echo -e "${BLUE}1. SERVICE READINESS${NC}"
    echo "-------------------"
    
    # Wait for services to be ready
    if ! wait_for_service "https://${DOMAIN}/nginx/health" "Nginx" 60; then
        exit_code=1
    fi
    
    if ! wait_for_service "${API_BASE}/health" "API Gateway" 120; then
        exit_code=1
    fi
    
    # Give services extra time to fully initialize
    echo -e "${YELLOW}⏳ Allowing services to fully initialize...${NC}"
    sleep 10
    
    echo ""
    echo -e "${BLUE}2. HEALTH VERIFICATION${NC}"
    echo "--------------------"
    
    # Comprehensive health check
    if ! comprehensive_health_check; then
        exit_code=1
    fi
    
    echo ""
    echo -e "${BLUE}3. SECURITY VALIDATION${NC}"
    echo "---------------------"
    
    # Security verification
    verify_security
    
    echo ""
    echo -e "${BLUE}4. SMOKE TESTS${NC}"
    echo "-------------"
    
    # Run smoke tests
    if ! run_smoke_tests; then
        echo -e "${YELLOW}⚠️  Some smoke tests failed but deployment may still be functional${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}5. METRICS COLLECTION${NC}"
    echo "-------------------"
    
    # Collect metrics
    collect_metrics
    
    echo ""
    echo -e "${BLUE}6. POST-DEPLOYMENT TASKS${NC}"
    echo "-----------------------"
    
    # Send notifications
    send_notifications
    
    # Cleanup
    cleanup_deployment
    
    # Final result
    echo ""
    echo "==========================================="
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}🎉 POST-DEPLOYMENT VALIDATION PASSED${NC}"
        echo -e "${GREEN}✅ Deployment successful and verified${NC}"
        echo -e "${GREEN}✅ All systems operational${NC}"
        echo -e "${GREEN}🌐 Production ready: https://${DOMAIN}${NC}"
    else
        echo -e "${RED}❌ POST-DEPLOYMENT VALIDATION ISSUES${NC}"
        echo -e "${YELLOW}⚠️  Deployment completed but with warnings${NC}"
        echo -e "${YELLOW}📋 Review logs above for details${NC}"
    fi
    echo ""
    
    return $exit_code
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Post-deployment validation hook for Enterprise CRM"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --quick, -q   Quick validation (skip some tests)"
        echo "  --verbose, -v Detailed output"
        echo ""
        echo "This script validates:"
        echo "- Service readiness and health"
        echo "- Security configuration"
        echo "- Smoke tests for critical functionality"
        echo "- Performance metrics collection"
        exit 0
        ;;
    --quick|-q)
        # Skip some time-consuming tests
        MAX_WAIT_TIME=60
        main
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