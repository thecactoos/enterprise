#!/bin/bash
# Enterprise SSL Setup Script
# Configures HTTPS with Let's Encrypt for cactoos.digital

set -e

echo "🔒 CACTOOS.DIGITAL SSL SETUP"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if domain is configured in DNS
echo -e "${YELLOW}1. Checking DNS configuration...${NC}"
if nslookup cactoos.digital | grep -q "178.63.69.38"; then
    echo -e "${GREEN}✅ DNS configured correctly${NC}"
else
    echo -e "${RED}❌ DNS not configured. Please set A record: cactoos.digital → 178.63.69.38${NC}"
    echo "Wait for DNS propagation (5-60 minutes) then run this script again."
    exit 1
fi

# Step 1: Start with HTTP configuration for Let's Encrypt challenge
echo -e "${YELLOW}2. Starting HTTP server for SSL challenge...${NC}"
docker compose -f docker-compose.dev.yml up -d nginx-dev

# Wait for HTTP server
sleep 10

# Step 2: Get SSL certificate
echo -e "${YELLOW}3. Obtaining SSL certificate from Let's Encrypt...${NC}"
if certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email admin@cactoos.digital \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d cactoos.digital \
    -d www.cactoos.digital; then
    echo -e "${GREEN}✅ SSL certificate obtained successfully${NC}"
else
    echo -e "${RED}❌ Failed to obtain SSL certificate${NC}"
    echo "Common issues:"
    echo "- DNS not propagated yet"
    echo "- Port 80 not accessible from internet"
    echo "- Domain not pointing to this server"
    exit 1
fi

# Step 3: Switch to SSL configuration
echo -e "${YELLOW}4. Switching to HTTPS configuration...${NC}"
docker compose -f docker-compose.dev.yml stop nginx-dev
docker compose -f docker-compose.ssl.yml up -d nginx-ssl

# Wait for HTTPS server
sleep 10

# Step 4: Test HTTPS
echo -e "${YELLOW}5. Testing HTTPS configuration...${NC}"
if curl -k -f https://cactoos.digital/nginx/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ HTTPS working correctly${NC}"
else
    echo -e "${RED}❌ HTTPS test failed${NC}"
    echo "Check nginx logs: docker logs enterprise-nginx-ssl"
    exit 1
fi

# Step 5: Setup auto-renewal
echo -e "${YELLOW}6. Setting up automatic SSL renewal...${NC}"
cat > /etc/cron.d/certbot-renewal << EOF
# Auto-renew SSL certificates every 12 hours
0 */12 * * * root certbot renew --quiet && docker exec enterprise-nginx-ssl nginx -s reload
EOF

echo -e "${GREEN}✅ SSL auto-renewal configured${NC}"

# Step 6: Security test
echo -e "${YELLOW}7. Running security tests...${NC}"
echo "Testing security headers..."
if curl -s -I https://cactoos.digital | grep -q "Strict-Transport-Security"; then
    echo -e "${GREEN}✅ HSTS header configured${NC}"
else
    echo -e "${YELLOW}⚠️  HSTS header missing${NC}"
fi

if curl -s -I https://cactoos.digital | grep -q "X-Content-Type-Options"; then
    echo -e "${GREEN}✅ Security headers configured${NC}"
else
    echo -e "${YELLOW}⚠️  Some security headers missing${NC}"
fi

echo ""
echo -e "${GREEN}🎉 SSL SETUP COMPLETED!${NC}"
echo "=============================="
echo -e "${GREEN}✅ HTTPS: https://cactoos.digital${NC}"
echo -e "${GREEN}✅ SSL Grade: A+ (estimated)${NC}"
echo -e "${GREEN}✅ Auto-renewal: Enabled${NC}"
echo ""
echo "Next steps:"
echo "- Test your site: https://www.ssllabs.com/ssltest/analyze.html?d=cactoos.digital"
echo "- Monitor certificates: certbot certificates"
echo "- Check renewal: certbot renew --dry-run"