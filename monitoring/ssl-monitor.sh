#!/bin/bash

# SSL Certificate Monitoring Script for cactoos.digital
# Monitors SSL certificate expiry, auto-renewal, and security grade

set -euo pipefail

# Configuration
DOMAIN="cactoos.digital"
ALERT_DAYS=30
LOG_FILE="/var/log/ssl-monitor.log"
ALERT_EMAIL=""  # Set this if you want email alerts
WEBHOOK_URL=""  # Set this for Slack/Discord notifications

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
            -d "{\"text\":\"[$level] SSL Monitor - $DOMAIN: $message\"}" \
            >/dev/null 2>&1 || true
    fi
    
    # Send email if configured
    if [[ -n "$ALERT_EMAIL" ]] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "[$level] SSL Alert - $DOMAIN" "$ALERT_EMAIL" >/dev/null 2>&1 || true
    fi
}

# Check certificate expiry
check_certificate_expiry() {
    log "Checking SSL certificate expiry for $DOMAIN"
    
    # Get certificate info
    local cert_info
    cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
    
    if [[ -z "$cert_info" ]]; then
        alert "CRITICAL" "Failed to retrieve SSL certificate information"
        return 1
    fi
    
    # Extract expiry date
    local expiry_date
    expiry_date=$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)
    
    if [[ -z "$expiry_date" ]]; then
        alert "CRITICAL" "Failed to parse certificate expiry date"
        return 1
    fi
    
    # Convert to epoch for comparison
    local expiry_epoch
    expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null)
    
    if [[ -z "$expiry_epoch" ]]; then
        alert "CRITICAL" "Failed to convert expiry date to epoch"
        return 1
    fi
    
    local current_epoch
    current_epoch=$(date +%s)
    
    local days_until_expiry
    days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
    
    log "Certificate expires in $days_until_expiry days ($expiry_date)"
    
    if [[ $days_until_expiry -le 7 ]]; then
        alert "CRITICAL" "Certificate expires in $days_until_expiry days!"
    elif [[ $days_until_expiry -le $ALERT_DAYS ]]; then
        alert "WARNING" "Certificate expires in $days_until_expiry days"
    else
        log "Certificate expiry check: OK ($days_until_expiry days remaining)"
    fi
    
    return 0
}

# Check SSL security grade
check_ssl_security() {
    log "Checking SSL security configuration for $DOMAIN"
    
    # Check TLS version support
    local tls_versions=("1.0" "1.1" "1.2" "1.3")
    local supported_versions=()
    
    for version in "${tls_versions[@]}"; do
        if echo | openssl s_client -tls$version -connect "$DOMAIN:443" >/dev/null 2>&1; then
            supported_versions+=("$version")
        fi
    done
    
    log "Supported TLS versions: ${supported_versions[*]}"
    
    # Alert if insecure versions are supported
    if [[ " ${supported_versions[*]} " =~ " 1.0 " ]] || [[ " ${supported_versions[*]} " =~ " 1.1 " ]]; then
        alert "WARNING" "Insecure TLS versions (1.0/1.1) are supported"
    fi
    
    # Check if TLS 1.3 is supported
    if [[ " ${supported_versions[*]} " =~ " 1.3 " ]]; then
        log "TLS 1.3 support: OK"
    else
        alert "INFO" "TLS 1.3 not supported (consider upgrading)"
    fi
    
    # Check security headers
    check_security_headers
}

# Check security headers
check_security_headers() {
    log "Checking security headers for $DOMAIN"
    
    local headers
    headers=$(curl -s -I "https://$DOMAIN" 2>/dev/null || echo "")
    
    if [[ -z "$headers" ]]; then
        alert "WARNING" "Failed to retrieve HTTP headers"
        return 1
    fi
    
    # Check for important security headers
    local required_headers=(
        "strict-transport-security"
        "x-frame-options"
        "x-content-type-options"
        "x-xss-protection"
    )
    
    local missing_headers=()
    
    for header in "${required_headers[@]}"; do
        if ! echo "$headers" | grep -qi "$header"; then
            missing_headers+=("$header")
        fi
    done
    
    if [[ ${#missing_headers[@]} -gt 0 ]]; then
        alert "WARNING" "Missing security headers: ${missing_headers[*]}"
    else
        log "Security headers check: OK"
    fi
}

# Check certificate auto-renewal
check_auto_renewal() {
    log "Checking Let's Encrypt auto-renewal configuration"
    
    # Check if certbot is installed
    if ! command -v certbot >/dev/null 2>&1; then
        alert "WARNING" "Certbot not found - auto-renewal may not be configured"
        return 1
    fi
    
    # Check certbot configuration
    local cert_info
    cert_info=$(certbot certificates 2>/dev/null | grep -A 10 "$DOMAIN" || echo "")
    
    if [[ -z "$cert_info" ]]; then
        alert "WARNING" "Domain not found in certbot certificates"
        return 1
    fi
    
    log "Certbot configuration found for $DOMAIN"
    
    # Check cron job for renewal
    if crontab -l 2>/dev/null | grep -q "certbot.*renew"; then
        log "Certbot renewal cron job: OK"
    else
        alert "WARNING" "No certbot renewal cron job found"
    fi
    
    # Test renewal (dry run)
    log "Testing certificate renewal (dry run)"
    if certbot renew --dry-run --quiet 2>/dev/null; then
        log "Certificate renewal test: OK"
    else
        alert "CRITICAL" "Certificate renewal test failed"
    fi
}

# Main monitoring function
main() {
    log "Starting SSL monitoring for $DOMAIN"
    
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    local exit_code=0
    
    # Run all checks
    check_certificate_expiry || exit_code=1
    check_ssl_security || exit_code=1
    check_auto_renewal || exit_code=1
    
    if [[ $exit_code -eq 0 ]]; then
        log "SSL monitoring completed successfully"
        echo -e "${GREEN}✓ SSL monitoring completed successfully${NC}"
    else
        log "SSL monitoring completed with warnings/errors"
        echo -e "${YELLOW}⚠ SSL monitoring completed with warnings/errors${NC}"
    fi
    
    return $exit_code
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi