#\!/bin/bash
# Fix health checks in docker-compose.dev.yml

# 1. Replace curl with wget (more reliable in Alpine)
sed -i 's/curl -f/wget --quiet --tries=1 --timeout=5 --spider/g' docker-compose.dev.yml

# 2. Replace localhost with 0.0.0.0 (better compatibility)
sed -i 's/http:\/\/localhost:/http:\/\/0.0.0.0:/g' docker-compose.dev.yml

# 3. Fix specific endpoint paths
sed -i 's|http://0.0.0.0:3004/health|http://0.0.0.0:3004/api/v1/contacts/health/check|g' docker-compose.dev.yml

echo "Health checks fixed\!"
