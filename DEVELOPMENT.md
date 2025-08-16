# 🛠 Development Guide - Enterprise CRM

Complete development setup guide for the Enterprise CRM system running at https://cactoos.digital.

## 🚀 Quick Start (5 minutes)

### Prerequisites:
- Docker & Docker Compose installed
- Git access to the repository
- 8GB+ RAM recommended

### Start Development Environment (ONE TIME SETUP):
```bash
# Navigate to project
cd /var/www/enterprise

# Start all microservices (with hot reload) - RUN ONCE!
docker compose -f docker-compose.dev.yml up -d

# Start HTTPS proxy (production SSL)
docker compose -f docker-compose.ssl.yml up -d nginx-ssl

# Verify everything is running
curl https://cactoos.digital/api/health
```

**Result**: All 9 microservices + Next.js frontend running with hot reload at https://cactoos.digital

### 🔒 Nginx Configuration (Important!):

#### Production Setup (Current):
- **nginx-ssl**: Handles HTTPS termination and routing (ports 80/443)
- **nginx-dev**: Disabled (conflicts with nginx-ssl on port 80)
- **SSL Certificates**: Let's Encrypt with auto-renewal
- **Routing**: 
  - https://cactoos.digital → frontend-next:3000
  - https://cactoos.digital/api/ → api-gateway:3000 (internal)

#### Why nginx-dev is Disabled:
```bash
# Both nginx-ssl and nginx-dev try to use port 80
# This causes: "Bind for 0.0.0.0:80 failed: port is already allocated"

# nginx-ssl provides everything needed:
# ✅ HTTPS termination
# ✅ Rate limiting  
# ✅ Security headers
# ✅ Routing to all services
# ✅ Static asset serving

# nginx-dev was redundant for development
```

#### Service Access Methods:
```bash
# Production HTTPS (recommended)
https://cactoos.digital              # Frontend
https://cactoos.digital/api/health   # API

# Development direct access
http://localhost:3000                # Frontend direct
http://localhost:3100/health         # API direct
```

### 🔥 After Setup - Just Code!
```bash
# Edit any file and save - no Docker commands needed!
vim api-gateway/src/users/users.controller.ts     # ✅ Reloads in 2-3 seconds
vim frontend-next/app/dashboard/page.tsx          # ✅ Hot module replacement
vim products-service/src/products/products.service.ts  # ✅ Auto-restart

# Your changes are live instantly - no docker restart needed!
```

## 🔥 Hot Reload Configuration

### ✅ Currently Configured Services:
All Node.js services use `npx nest start --watch` for automatic restart on file changes:

```yaml
# Example from docker-compose.dev.yml
users-service:
  command: npx nest start --watch  # ✅ Hot reload enabled
  volumes:
    - ./users-service:/app
  environment:
    - NODE_ENV=development
```

### ⚡ Hot Reload Coverage (ALL Services):
- ✅ **API Gateway** (port 3100→3000) - Routes, middleware, auth logic
- ✅ **Frontend Next** (port 3000) - React components, pages, styles
- ✅ **Services Service** (port 3001) - Service definitions and pricing
- ✅ **Quotes Service** (port 3002) - Quote generation logic
- ✅ **Users Service** (port 3003) - User management endpoints
- ✅ **Contacts Service** (port 3004) - Contact/lead CRUD operations
- ✅ **Products Service** (port 3005) - Product catalog APIs
- ✅ **Notes Service** (port 3006) - Notes and comments
- ✅ **Invoices Service** (port 3007) - Invoice processing
- ⚠️ **OCR Service** (port 8000) - Python service (restart needed for changes)
- 🔒 **Nginx SSL** (ports 80/443) - Production HTTPS routing

### 🚀 Development Experience:
1. **Start once**: `docker compose -f docker-compose.dev.yml up -d`
2. **Code all day**: Edit any TypeScript, React, CSS file
3. **Save file**: Changes apply in 2-5 seconds automatically
4. **Test immediately**: Refresh browser, call API - it's already updated!

### File Change Detection:
```bash
# Edit any .ts/.js file in services
# Service automatically restarts within 2-3 seconds
# Check logs to confirm restart:
docker logs enterprise-api-gateway-dev -f
```

### ⚠️ **IMPORTANT: DON'T RESTART UNNECESSARILY!**
```bash
# ❌ WRONG - Unnecessary restart
docker compose -f docker-compose.dev.yml restart api-gateway

# ✅ CORRECT - Just edit files, hot reload handles it
# 1. Edit ./api-gateway/src/anyfile.ts
# 2. Save file
# 3. Wait 2-3 seconds
# 4. Service automatically reloads
```

**Only restart when:**
- Changes to `Dockerfile`
- New dependencies in `package.json` (after `npm install`)
- Major environment variable changes
- Docker Compose configuration changes
- Service completely stuck (rare)
- Port conflicts requiring container recreation

## 🔧 Nginx & SSL Troubleshooting

### Current Setup:
- **nginx-ssl**: Production HTTPS routing (ports 80/443)
- **nginx-dev**: Disabled (conflicts with nginx-ssl)
- **Routing**: nginx-ssl → API Gateway (port 3100) & Frontend (port 3000)

### Common Nginx Issues:

#### 1. nginx-dev Conflicts with nginx-ssl:
```bash
# Problem: Both try to use port 80
# Error: "Bind for 0.0.0.0:80 failed: port is already allocated"

# Solution: Disable nginx-dev, use nginx-ssl only
docker compose -f docker-compose.dev.yml stop nginx-dev
docker compose -f docker-compose.ssl.yml ps nginx-ssl  # Should be running
```

#### 2. 502 Bad Gateway Errors:
```bash
# Problem: nginx-ssl can't connect to backend services
# Check backend services are running
docker compose -f docker-compose.dev.yml ps | grep -E "(api-gateway|frontend-next)"

# Test internal connectivity
docker exec enterprise-nginx-ssl wget -q -O - http://enterprise-api-gateway-dev:3000/health
docker exec enterprise-nginx-ssl wget -q -O - http://enterprise-frontend-next-dev:3000

# Restart nginx-ssl to refresh container links
docker compose -f docker-compose.ssl.yml restart nginx-ssl
```

#### 3. Port Conflicts After Changes:
```bash
# Problem: Port mappings changed but containers not recreated
# Check current port assignments
docker ps | grep -E "(api-gateway|frontend-next)"

# Force recreate containers with new ports
docker compose -f docker-compose.dev.yml up -d --force-recreate api-gateway frontend-next

# Verify correct ports
# API Gateway: 3100 (external) → 3000 (internal)
# Frontend: 3000 (external) → 3000 (internal)
```

#### 4. SSL Certificate Issues:
```bash
# Check certificate validity
docker exec enterprise-nginx-ssl certbot certificates

# Manual renewal
./setup-ssl.sh

# Test SSL connectivity
curl -s -I https://cactoos.digital  # Should not show SSL errors
```

### Verification Commands:
```bash
# Complete system health check
curl -s https://cactoos.digital/api/health  # API through SSL
curl -s -I https://cactoos.digital         # Frontend through SSL
curl -s http://localhost:3000             # Frontend direct
curl -s http://localhost:3100/health      # API direct

# All should work without errors
```

### 🛠️ Development Workflow:
```bash
# Normal development (99% of time - no Docker commands!)
vim api-gateway/src/auth/auth.service.ts         # Edit and save
vim frontend-next/app/dashboard/contacts/page.tsx # Hot reload in browser

# Test services directly (development)
curl http://localhost:3000           # Frontend Next.js
curl http://localhost:3100/health    # API Gateway
curl https://cactoos.digital/api/health  # Production SSL route

# Debugging (when something seems off)
docker compose -f docker-compose.dev.yml logs -f api-gateway
docker compose -f docker-compose.dev.yml logs -f frontend-next

# Nginx troubleshooting
docker compose -f docker-compose.ssl.yml logs -f nginx-ssl
curl -s -I https://cactoos.digital  # Should return 307 redirect

# Port conflict resolution
docker ps | grep ":80\|:3000\|:3100"  # Check port usage

# Rare restart (only when hot reload fails)
docker compose -f docker-compose.dev.yml restart users-service

# Adding new dependency
npm install express-validator
docker compose -f docker-compose.dev.yml restart api-gateway
```

## 🗄️ Database Setup

### PostgreSQL Configuration:
```bash
# Database is automatically initialized with:
- Database: enterprise_crm
- User: postgres  
- Password: EnterpriseSecure2024!@#
- Port: 5432 (exposed)

# Access database via pgAdmin:
# URL: http://178.63.69.38:5050
# Email: admin@enterprise.local
# Password: devpassword123
```

### Database Health Check:
```bash
# Check database connection
docker exec enterprise-postgres-dev pg_isready -U postgres

# Connect directly to database
docker exec -it enterprise-postgres-dev psql -U postgres -d enterprise_crm
```

### Database Migrations:
```bash
# Migrations run automatically on container start
# Location: ./database/init.sql and ./database/migrations/
```

## 🌐 Frontend Development

### React Development Server:
```bash
# Frontend runs on port 3000 with hot reload
# Accessible via: https://cactoos.digital
# Direct access: http://localhost:3000 (if port exposed)

# Frontend environment variables:
REACT_APP_API_BASE_URL=https://cactoos.digital/api
DANGEROUSLY_DISABLE_HOST_CHECK=true  # For hot reload
```

### Frontend Development Workflow:
1. Edit files in `./frontend/src/`
2. Changes automatically reload in browser
3. API calls proxied through Nginx to backend services
4. Test changes at https://cactoos.digital

## 🔧 Service Development

### Add New Microservice:
1. **Create service directory**: `./new-service/`
2. **Add to docker-compose.dev.yml**:
```yaml
new-service:
  build: ./new-service
  container_name: enterprise-new-service-dev
  restart: unless-stopped
  command: npx nest start --watch  # Hot reload
  ports:
    - "3010:3000"  # Next available port
  volumes:
    - ./new-service:/app
    - /app/node_modules
  environment:
    - NODE_ENV=development
    - DATABASE_URL=postgresql://postgres:EnterpriseSecure2024!@#@postgres:5432/enterprise_crm
  depends_on:
    postgres:
      condition: service_healthy
  networks:
    - enterprise-network
```
3. **Register with API Gateway** in `api-gateway/src/app.module.ts`
4. **Start service**: `docker compose -f docker-compose.dev.yml up -d new-service`

### Service Communication:
```typescript
// Services communicate via HTTP within Docker network
// Example API Gateway calling Users Service:
const response = await this.httpService.get('http://enterprise-users-service-dev:3000/users').toPromise();
```

## 📊 Development Monitoring

### Service Health Monitoring:
```bash
# Check all services status
docker compose -f docker-compose.dev.yml ps

# View service logs
docker logs enterprise-api-gateway-dev -f
docker logs enterprise-frontend-dev -f

# Check resource usage
docker stats
```

### API Testing:
```bash
# Test API endpoints
curl https://cactoos.digital/api/health
curl https://cactoos.digital/api/users
curl https://cactoos.digital/api/contacts

# Test specific service directly (if port exposed)
curl http://localhost:3001/health  # Users service
```

## 🔄 Development Workflow

### Daily Development:
1. **Start services**: `docker compose -f docker-compose.dev.yml up -d`
2. **Check health**: `curl https://cactoos.digital/api/health`
3. **Edit code** - changes auto-reload
4. **View logs**: `docker logs <service-name> -f`
5. **Test changes** in browser at https://cactoos.digital

### Code Changes Process:
1. **Edit files** in service directories
2. **Watch logs** for automatic restart confirmation
3. **Test API changes** via frontend or curl
4. **Database changes** require service restart
5. **New dependencies** require container rebuild

### Debugging Services:
```bash
# View service logs
docker logs enterprise-api-gateway-dev --tail 100

# Enter service container for debugging
docker exec -it enterprise-api-gateway-dev /bin/bash

# Check service configuration
docker exec enterprise-api-gateway-dev env | grep DATABASE
```

## 🧪 Testing

### Manual Testing:
```bash
# Test all major endpoints
curl https://cactoos.digital/api/health
curl https://cactoos.digital/api/users
curl https://cactoos.digital/api/contacts
curl https://cactoos.digital/api/products
```

### Database Testing:
```bash
# Access test data via pgAdmin
# URL: http://178.63.69.38:5050
# Connect to enterprise_crm database
# Test users available in users-service/TEST_USERS.md
```

## 🔒 Development Security

### HTTPS in Development:
- ✅ **Full HTTPS** even in development mode
- ✅ **Real SSL certificates** from Let's Encrypt
- ✅ **Security headers** configured in Nginx
- ✅ **Rate limiting** active in development

### Environment Variables:
```bash
# Development environment uses production-grade security
# Database passwords: Strong passwords even in dev
# JWT secrets: 32+ character secure keys
# SSL: Real certificates, not self-signed
```

## 📁 Project Structure

### Service Organization:
```
/var/www/enterprise/
├── api-gateway/          # Main API routing & auth
├── users-service/        # User management
├── contacts-service/     # Contact/lead management
├── products-service/     # Product catalog
├── notes-service/        # Notes system
├── services-service/     # Service definitions
├── quotes-service/       # Quote generation
├── invoices-service/     # Invoice management
├── ocr-service/          # Document processing
├── frontend/             # React SPA
├── database/             # DB schema & migrations
├── nginx/                # Reverse proxy config
├── docker-compose.dev.yml   # Development services
├── docker-compose.ssl.yml   # HTTPS configuration
└── .env.prod             # Production environment
```

## 🚨 Troubleshooting

### Common Issues:

#### Service Won't Start:
```bash
# Check logs
docker logs <service-name>

# Rebuild container
docker compose -f docker-compose.dev.yml build <service-name>
docker compose -f docker-compose.dev.yml up -d <service-name>
```

#### Hot Reload Not Working:
```bash
# Check if volumes are mounted correctly
docker inspect <container-name> | grep -A 10 "Mounts"

# Restart service
docker compose -f docker-compose.dev.yml restart <service-name>
```

#### Database Connection Issues:
```bash
# Check PostgreSQL health
docker exec enterprise-postgres-dev pg_isready -U postgres

# Verify connection string
docker exec <service-name> env | grep DATABASE
```

#### Frontend Not Loading:
```bash
# Check frontend service
docker logs enterprise-frontend-dev

# Check Nginx proxy
curl -I https://cactoos.digital
```

### Performance Issues:
```bash
# Check system resources
htop
docker stats

# Check service memory usage
docker exec <service-name> ps aux
```

## 📞 Development Support

### Quick Commands:
```bash
# Start everything
docker compose -f docker-compose.dev.yml up -d && docker compose -f docker-compose.ssl.yml up -d nginx-ssl

# Stop everything  
docker compose -f docker-compose.dev.yml down && docker compose -f docker-compose.ssl.yml down

# Restart single service
docker compose -f docker-compose.dev.yml restart api-gateway

# View all logs
docker compose -f docker-compose.dev.yml logs -f
```

### Development URLs:
- **Application**: https://cactoos.digital
- **API Health**: https://cactoos.digital/api/health
- **pgAdmin**: http://178.63.69.38:5050
- **Portainer**: http://178.63.69.38:9000

---

## 🎯 Ready for Development!

✅ **Hot reload** configured for all services  
✅ **HTTPS** working in development  
✅ **Database** accessible via pgAdmin  
✅ **All microservices** running and monitored  
✅ **Production-grade** security in development  

**Start developing at https://cactoos.digital with instant hot reload!**