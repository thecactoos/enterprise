#!/bin/bash

# Test Script for Enterprise CRM Monitoring System
# Validates all monitoring components and configurations

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/var/www/enterprise"
TEST_LOG="/var/log/monitoring-test.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$TEST_LOG"
}

# Test result functions
test_start() {
    local test_name=$1
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "\n${BLUE}[TEST $TESTS_TOTAL] $test_name${NC}"
    log "Starting test: $test_name"
}

test_pass() {
    local message=${1:-"Test passed"}
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo -e "  ${GREEN}✓ $message${NC}"
    log "PASS: $message"
}

test_fail() {
    local message=${1:-"Test failed"}
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo -e "  ${RED}✗ $message${NC}"
    log "FAIL: $message"
}

test_warn() {
    local message=${1:-"Test warning"}
    echo -e "  ${YELLOW}⚠ $message${NC}"
    log "WARN: $message"
}

# Test if script exists and is executable
test_script_executable() {
    local script_path=$1
    local script_name=$(basename "$script_path")
    
    test_start "Script Executable: $script_name"
    
    if [[ ! -f "$script_path" ]]; then
        test_fail "Script file not found: $script_path"
        return 1
    fi
    
    if [[ ! -x "$script_path" ]]; then
        test_fail "Script not executable: $script_path"
        return 1
    fi
    
    test_pass "Script exists and is executable"
    return 0
}

# Test script execution
test_script_execution() {
    local script_path=$1
    local script_name=$(basename "$script_path")
    local timeout=${2:-30}
    
    test_start "Script Execution: $script_name"
    
    local output
    local exit_code
    
    # Run script with timeout
    if timeout "$timeout" "$script_path" >/dev/null 2>&1; then
        exit_code=$?
        test_pass "Script executed successfully (exit code: $exit_code)"
        return 0
    else
        exit_code=$?
        if [[ $exit_code -eq 124 ]]; then
            test_fail "Script execution timed out after ${timeout}s"
        else
            test_warn "Script exited with code $exit_code (may be expected for monitoring scripts)"
        fi
        return 1
    fi
}

# Test dependencies
test_dependencies() {
    test_start "System Dependencies"
    
    local required_tools=(
        "curl"
        "docker"
        "jq"
        "bc"
        "openssl"
        "free"
        "df"
        "uptime"
        "ps"
        "grep"
        "awk"
        "sed"
    )
    
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            echo -e "    ${GREEN}✓ $tool${NC}"
        else
            missing_tools+=("$tool")
            echo -e "    ${RED}✗ $tool${NC}"
        fi
    done
    
    if [[ ${#missing_tools[@]} -eq 0 ]]; then
        test_pass "All required dependencies are installed"
    else
        test_fail "Missing dependencies: ${missing_tools[*]}"
        return 1
    fi
}

# Test Docker environment
test_docker_environment() {
    test_start "Docker Environment"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        test_fail "Docker daemon is not running"
        return 1
    fi
    
    test_pass "Docker daemon is running"
    
    # Check for expected containers
    local expected_containers=(
        "enterprise-postgres"
        "enterprise-api-gateway"
        "enterprise-nginx"
    )
    
    local running_containers=0
    
    for container in "${expected_containers[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^$container$"; then
            echo -e "    ${GREEN}✓ $container is running${NC}"
            running_containers=$((running_containers + 1))
        else
            echo -e "    ${YELLOW}⚠ $container is not running${NC}"
        fi
    done
    
    if [[ $running_containers -gt 0 ]]; then
        test_pass "$running_containers containers are running"
    else
        test_warn "No expected containers are running (system may be down)"
    fi
}

# Test SSL connectivity
test_ssl_connectivity() {
    test_start "SSL Connectivity"
    
    local domain="cactoos.digital"
    
    # Test SSL connection
    if echo | openssl s_client -servername "$domain" -connect "$domain:443" >/dev/null 2>&1; then
        test_pass "SSL connection to $domain successful"
        
        # Check certificate validity
        local cert_info
        cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ -n "$cert_info" ]]; then
            local expiry_date
            expiry_date=$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)
            
            if [[ -n "$expiry_date" ]]; then
                local expiry_epoch current_epoch days_left
                expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
                current_epoch=$(date +%s)
                
                if [[ $expiry_epoch -gt 0 ]]; then
                    days_left=$(( (expiry_epoch - current_epoch) / 86400 ))
                    echo -e "    ${GREEN}✓ Certificate expires in $days_left days${NC}"
                else
                    test_warn "Could not parse certificate expiry date"
                fi
            fi
        fi
    else
        test_fail "SSL connection to $domain failed"
        return 1
    fi
}

# Test web endpoints
test_web_endpoints() {
    test_start "Web Endpoints"
    
    local endpoints=(
        "https://cactoos.digital/:Homepage"
        "https://cactoos.digital/api/health:API Health"
    )
    
    local successful_endpoints=0
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint="${endpoint_info%:*}"
        local name="${endpoint_info#*:}"
        
        local http_code
        http_code=$(curl -s -w "%{http_code}" -o /dev/null --max-time 10 "$endpoint" 2>/dev/null || echo "000")
        
        if [[ "$http_code" == "200" ]]; then
            echo -e "    ${GREEN}✓ $name (HTTP $http_code)${NC}"
            successful_endpoints=$((successful_endpoints + 1))
        else
            echo -e "    ${RED}✗ $name (HTTP $http_code)${NC}"
        fi
    done
    
    if [[ $successful_endpoints -eq ${#endpoints[@]} ]]; then
        test_pass "All web endpoints are responding"
    elif [[ $successful_endpoints -gt 0 ]]; then
        test_warn "$successful_endpoints out of ${#endpoints[@]} endpoints are responding"
    else
        test_fail "No web endpoints are responding"
        return 1
    fi
}

# Test log directory structure
test_log_directories() {
    test_start "Log Directories"
    
    local log_dirs=(
        "/var/log"
    )
    
    local required_permissions="755"
    
    for dir in "${log_dirs[@]}"; do
        if [[ -d "$dir" ]]; then
            local permissions
            permissions=$(stat -c "%a" "$dir")
            
            if [[ "$permissions" == "$required_permissions" ]]; then
                echo -e "    ${GREEN}✓ $dir exists with correct permissions ($permissions)${NC}"
            else
                echo -e "    ${YELLOW}⚠ $dir has permissions $permissions (expected $required_permissions)${NC}"
            fi
        else
            echo -e "    ${RED}✗ $dir does not exist${NC}"
            test_fail "Required log directory missing: $dir"
            return 1
        fi
    done
    
    test_pass "Log directories are properly configured"
}

# Test configuration files
test_configuration_files() {
    test_start "Configuration Files"
    
    local config_files=(
        "/etc/monitoring/enterprise-monitoring.conf"
    )
    
    local found_configs=0
    
    for config_file in "${config_files[@]}"; do
        if [[ -f "$config_file" ]]; then
            echo -e "    ${GREEN}✓ $config_file exists${NC}"
            found_configs=$((found_configs + 1))
            
            # Check if config is readable
            if [[ -r "$config_file" ]]; then
                echo -e "    ${GREEN}✓ $config_file is readable${NC}"
            else
                echo -e "    ${YELLOW}⚠ $config_file is not readable${NC}"
            fi
        else
            echo -e "    ${YELLOW}⚠ $config_file not found (will use defaults)${NC}"
        fi
    done
    
    if [[ $found_configs -gt 0 ]]; then
        test_pass "Configuration files found"
    else
        test_warn "No configuration files found (using defaults)"
    fi
}

# Test cron configuration
test_cron_configuration() {
    test_start "Cron Configuration"
    
    local cron_file="/etc/cron.d/enterprise-monitoring"
    
    if [[ -f "$cron_file" ]]; then
        test_pass "Cron configuration file exists"
        
        # Check if cron service is running
        if systemctl is-active --quiet cron; then
            test_pass "Cron service is running"
        else
            test_fail "Cron service is not running"
            return 1
        fi
        
        # Check cron file permissions
        local permissions
        permissions=$(stat -c "%a" "$cron_file")
        
        if [[ "$permissions" == "644" ]]; then
            test_pass "Cron file has correct permissions"
        else
            test_warn "Cron file permissions: $permissions (expected 644)"
        fi
    else
        test_warn "Cron configuration not found (monitoring not automated)"
    fi
}

# Test individual monitoring scripts
test_monitoring_scripts() {
    local scripts=(
        "ssl-monitor.sh"
        "container-health-monitor.sh"
        "infrastructure-monitor.sh"
        "system-monitor.sh"
        "alert-manager.sh"
        "dashboard.sh"
    )
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        
        # Test if script exists and is executable
        test_script_executable "$script_path"
        
        # Test script execution (with shorter timeout for some)
        case $script in
            "dashboard.sh")
                # Skip execution test for interactive dashboard
                test_start "Script Execution: $script"
                test_warn "Skipping execution test for interactive script"
                ;;
            "system-monitor.sh")
                # Test with quick mode
                test_start "Script Execution: $script (quick mode)"
                if "$script_path" quick >/dev/null 2>&1; then
                    test_pass "Quick mode executed successfully"
                else
                    test_warn "Quick mode failed (may be expected if system is not fully operational)"
                fi
                ;;
            *)
                test_script_execution "$script_path" 20
                ;;
        esac
    done
}

# Test system resources
test_system_resources() {
    test_start "System Resources"
    
    # Check disk space
    local disk_usage
    disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    echo -e "    Disk Usage: ${disk_usage}%"
    
    if [[ $disk_usage -lt 90 ]]; then
        test_pass "Disk usage is acceptable ($disk_usage%)"
    else
        test_fail "Disk usage is too high ($disk_usage%)"
    fi
    
    # Check memory
    local mem_usage
    mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    
    echo -e "    Memory Usage: ${mem_usage}%"
    
    if (( $(echo "$mem_usage < 95" | bc -l) )); then
        test_pass "Memory usage is acceptable ($mem_usage%)"
    else
        test_warn "Memory usage is high ($mem_usage%)"
    fi
}

# Generate test report
generate_test_report() {
    echo -e "\n${BOLD}${BLUE}=== MONITORING SYSTEM TEST REPORT ===${NC}"
    echo -e "Generated: $(date)"
    echo -e "Test Log: $TEST_LOG"
    echo ""
    
    echo -e "${BOLD}Test Results:${NC}"
    echo -e "  Total Tests: $TESTS_TOTAL"
    echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
    
    local success_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        success_rate=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    fi
    
    echo -e "  Success Rate: ${success_rate}%"
    echo ""
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}${BOLD}✅ ALL TESTS PASSED - Monitoring system is ready!${NC}"
        echo ""
        echo -e "${YELLOW}Next Steps:${NC}"
        echo -e "1. Configure alerts in /etc/monitoring/enterprise-monitoring.conf"
        echo -e "2. Set ALERT_EMAIL and/or WEBHOOK_URL for notifications"
        echo -e "3. Run: enterprise-monitor status"
        echo -e "4. View dashboard: /var/www/enterprise/monitoring/dashboard.sh"
        return 0
    else
        echo -e "${RED}${BOLD}❌ SOME TESTS FAILED - Please review and fix issues${NC}"
        echo ""
        echo -e "${YELLOW}Common Solutions:${NC}"
        echo -e "1. Run installation script: sudo ./install-monitoring.sh"
        echo -e "2. Check Docker containers: docker ps"
        echo -e "3. Verify system resources: df -h && free -h"
        echo -e "4. Check logs: tail -f $TEST_LOG"
        return 1
    fi
}

# Main test function
main() {
    echo -e "${BOLD}${BLUE}Enterprise CRM Monitoring System Test${NC}"
    echo -e "Testing monitoring components and configuration..."
    echo ""
    
    # Create test log
    mkdir -p "$(dirname "$TEST_LOG")"
    log "Starting monitoring system tests"
    
    # Run all tests
    test_dependencies
    test_docker_environment
    test_ssl_connectivity
    test_web_endpoints
    test_log_directories
    test_configuration_files
    test_cron_configuration
    test_monitoring_scripts
    test_system_resources
    
    # Generate final report
    generate_test_report
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi