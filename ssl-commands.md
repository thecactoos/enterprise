# SSL Setup Commands for cactoos.digital

## ✅ COMPLETED - SSL FULLY CONFIGURED

**Status**: HTTPS is live and working at https://cactoos.digital
- SSL Grade: A+ (SSL Labs)
- Auto-renewal: Configured and tested
- Security headers: All implemented
- Certificate expires: 2025-11-02

## Prerequisites (✅ Completed)
1. ✅ **DNS configured**: A record `cactoos.digital` → `178.63.69.38`
2. ✅ **Port 80/443 open** in firewall
3. ✅ **Domain propagated** (verified with `nslookup cactoos.digital`)

## Setup Process Used (✅ Completed)

### Automated Setup (Used Successfully):
```bash
cd /var/www/enterprise
./setup-ssl.sh  # ✅ Completed successfully
```

**Issues Fixed During Setup:**
- Added certbot volume mount to nginx-dev service
- Fixed Let's Encrypt challenge path in prod.conf
- Created `/var/www/certbot/.well-known/acme-challenge/` directory
- Fixed docker-compose.ssl.yml network configuration

## Current Production Configuration (✅ Active)

### Active Services:
```bash
# HTTPS Nginx (running)
docker compose -f docker-compose.ssl.yml ps nginx-ssl

# All microservices (running with hot reload)
docker compose -f docker-compose.dev.yml ps
```

### SSL Certificate Status:
```bash
# Check certificate details
certbot certificates
# ✅ Certificate: cactoos.digital
# ✅ Expiry: 2025-11-02
# ✅ Domains: cactoos.digital, www.cactoos.digital

# Test auto-renewal (verified working)
certbot renew --dry-run
```

### Production URLs (All Working):
```bash
# Frontend
curl https://cactoos.digital/

# API Health
curl https://cactoos.digital/api/health

# Nginx Health  
curl https://cactoos.digital/nginx/health

# Security headers test
curl -I https://cactoos.digital | grep -E "Strict-Transport-Security|X-Content-Type-Options"
```

### Auto-renewal Configuration (✅ Active):
```bash
# Cron job (configured)
cat /etc/cron.d/certbot-renewal
# 0 */12 * * * root certbot renew --quiet && docker exec enterprise-nginx-ssl nginx -s reload

# Manual renewal test
certbot renew --dry-run  # ✅ Successful
```

## Monitoring & Maintenance

### SSL Certificate Monitoring:
```bash
# Check certificate expiry
certbot certificates

# Check certificate details
openssl x509 -in /etc/letsencrypt/live/cactoos.digital/cert.pem -text -noout | grep "Not After"

# Verify SSL grade
curl -I https://cactoos.digital | head -20
```

### System Health Checks:
```bash
# Check all services
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.ssl.yml ps

# Check nginx configuration
docker exec enterprise-nginx-ssl nginx -t

# View nginx logs
docker logs enterprise-nginx-ssl --tail 50

# Check system resources
htop
vmstat 1 3
```

### Troubleshooting (If Needed):
```bash
# Restart HTTPS nginx
docker compose -f docker-compose.ssl.yml restart nginx-ssl

# Force certificate renewal (if needed)
certbot renew --force-renewal

# Check Let's Encrypt challenge path
curl http://cactoos.digital/.well-known/acme-challenge/test
```

## Security Testing & Validation

### Production Security Tests (✅ All Passing):
- **SSL Labs**: https://www.ssllabs.com/ssltest/analyze.html?d=cactoos.digital (Grade: A+)
- **Security Headers**: https://securityheaders.com/?q=cactoos.digital
- **Mozilla Observatory**: https://observatory.mozilla.org/analyze/cactoos.digital

### Security Features Implemented:
- ✅ **HSTS**: Strict-Transport-Security with preload
- ✅ **CSP**: Content-Security-Policy configured
- ✅ **X-Frame-Options**: SAMEORIGIN protection
- ✅ **X-Content-Type-Options**: nosniff enabled
- ✅ **Rate Limiting**: API (100/min), Auth (20/min), Frontend (200/min)
- ✅ **Modern TLS**: Only TLS 1.2 and 1.3 enabled
- ✅ **OCSP Stapling**: Certificate validation optimization

### Performance Features:
- ✅ **HTTP/2**: Enabled for faster loading
- ✅ **Gzip Compression**: All text assets compressed
- ✅ **Static Asset Caching**: 1-year cache for static files
- ✅ **SSL Session Caching**: 10-minute session reuse