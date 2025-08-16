# 🚀 Enterprise CRM System

**Production URL**: https://cactoos.digital  
**Status**: ✅ Live & Operational  
**SSL Grade**: A+ (Enterprise Security)  

Modern microservices-based CRM system for Polish B2B/B2C market, built with Node.js (NestJS), Next.js, and PostgreSQL.

## 🌐 Production System

### Live URLs:
- **Application**: https://cactoos.digital
- **API Gateway**: https://cactoos.digital/api/health
- **Database Management**: https://cactoos.digital/pgadmin/ 🔐
- **Container Management**: https://cactoos.digital/portainer/ 🔐

### Direct Access (Development):
- **pgAdmin Direct**: http://178.63.69.38:5050
- **Portainer Direct**: http://178.63.69.38:9000

### Microservices Architecture:
- **API Gateway** - Port 3100→3000 - Central routing, auth, business logic
- **Frontend Next** - Port 3000 - Next.js 15 with shadcn/ui (Primary)
- **Services Service** - Port 3001 - Service definitions with pricing
- **Quotes Service** - Port 3002 - Quote generation and management
- **Users Service** - Port 3003 - User management and authentication
- **Contacts Service** - Port 3004 - Unified contact/lead management
- **Products Service** - Port 3005 - Product catalog (70,000+ items)
- **Notes Service** - Port 3006 - Activity tracking and notes
- **Invoices Service** - Port 3007 - Invoice management with Polish VAT
- **OCR Service** - Port 8000 - Document processing (Python)
- **Nginx SSL** - Ports 80/443 - HTTPS termination and routing

### Infrastructure:
- **PostgreSQL 15** - Primary database with automated backups
- **Nginx SSL** - HTTPS termination, rate limiting, compression (production)
- **Docker Compose** - Multi-environment orchestration with port management
- **Let's Encrypt** - SSL certificates with 12h auto-renewal
- **Redis** - Caching layer (API Gateway) on port 6379
- **Network**: Single enterprise-network for all services

## ✨ Production Features

### Business Logic:
- ✅ **Contact Management** - Unified leads/clients system
- ✅ **User Authentication** - JWT-based security
- ✅ **Product Catalog** - Flooring/construction products
- ✅ **Quote Generation** - Dynamic pricing system
- ✅ **Service Definitions** - Flooring services catalog
- ✅ **Invoice Management** - Business transactions
- ✅ **Document Processing** - OCR for PDF analysis
- ✅ **Notes System** - Communication tracking

### Technical Features:
- ✅ **Enterprise SSL** - A+ grade security with HSTS
- ✅ **Hot Reload** - All services with live updates (no restarts needed!)
- ✅ **Health Checks** - Automated service monitoring
- ✅ **Rate Limiting** - API protection (100/min)
- ✅ **Static Caching** - Optimized asset delivery
- ✅ **Auto-Renewal** - SSL certificates via Let's Encrypt

## 🛠 Quick Start

### Prerequisites:
- Docker & Docker Compose installed
- 8GB+ RAM recommended
- Git access to repository

### Development Setup (One-Time Setup):
```bash
# Clone repository
git clone [repository-url] /var/www/enterprise
cd /var/www/enterprise

# Start all services (hot reload enabled) - RUN ONCE!
docker compose -f docker-compose.dev.yml up -d

# Start HTTPS proxy (for production SSL)
docker compose -f docker-compose.ssl.yml up -d nginx-ssl

# Verify installation
curl https://cactoos.digital/api/health

# Now just edit files - changes apply automatically!
```

### 🔥 Hot Reload Development:
```bash
# Edit any file and save - changes apply instantly:
vim api-gateway/src/users/users.controller.ts    # ✅ Auto-reloads
vim frontend-next/app/dashboard/page.tsx         # ✅ Hot module replacement
vim products-service/src/products/products.service.ts  # ✅ Live updates

# No restarts needed for code changes!
```

### Common Operations (When Actually Needed):
```bash
# View service logs (useful for debugging)
docker compose -f docker-compose.dev.yml logs -f [service-name]

# Only restart when you add npm packages or change Docker config
docker compose -f docker-compose.dev.yml restart [service-name]

# Database backup
./backup.sh

# Check SSL status
docker exec nginx-ssl certbot certificates
```

## 📚 Documentation

### Essential Guides:
- **[CLAUDE.md](./CLAUDE.md)** - AI assistant guidance and project overview
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development environment setup
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[PRODUCTION-STATUS.md](./PRODUCTION-STATUS.md)** - Live system status

### Technical Documentation:
- **[REMOTE-SETUP.md](./REMOTE-SETUP.md)** - Remote development configuration
- **[ssl-commands.md](./ssl-commands.md)** - SSL certificate management
- **[database/README_DATABASE.md](./database/README_DATABASE.md)** - Database schema and migrations
- **[monitoring/README.md](./monitoring/README.md)** - System monitoring setup

### Service Documentation:
- **[frontend-legacy/MOCK_DATA_GUIDE.md](./frontend-legacy/MOCK_DATA_GUIDE.md)** - Legacy frontend mock data
- **[users-service/TEST_USERS.md](./users-service/TEST_USERS.md)** - Test user accounts
- **[docs/IMPORT_PROCESS_DOCUMENTATION.md](./docs/IMPORT_PROCESS_DOCUMENTATION.md)** - Data import process

## 🔐 Security

### Production Security:
- **SSL/TLS**: TLS 1.2, TLS 1.3 only
- **HSTS**: HTTP Strict Transport Security enabled
- **CSP**: Content Security Policy configured
- **Rate Limiting**: 100 req/min API, 20 req/min auth
- **Security Headers**: X-Frame-Options, X-Content-Type-Options

### Monitoring:
- **Health Checks**: All services monitored
- **Auto-Renewal**: SSL certificates every 12 hours
- **Resource Monitoring**: CPU, memory, disk usage
- **Log Management**: Automatic rotation

## 🚀 Performance

### Current Metrics:
- **Response Time**: <200ms frontend, <50ms API
- **CPU Usage**: 0.28 load average (very low)
- **Memory**: 5.3GB/62.7GB (8% utilization)
- **SSL Grade**: A+ with modern TLS
- **Uptime**: 14+ hours since deployment

## 📞 Support

### Quick Health Checks:
```bash
# Test all endpoints
curl https://cactoos.digital/                    # Frontend
curl https://cactoos.digital/api/health          # API
curl https://cactoos.digital/nginx/health        # Nginx

# Check services
docker compose -f docker-compose.dev.yml ps
```

### Key Commands:
```bash
# View logs
docker logs enterprise-api-gateway-dev --tail 50

# Restart services
docker compose -f docker-compose.dev.yml restart

# Check SSL status
certbot renew --dry-run
```

---

## 📞 System Architecture Summary

### Current Configuration (After Recent Updates):
- **Frontend**: Next.js 15 on port 3000 (primary)
- **API Gateway**: Port 3100 (external) → 3000 (internal)
- **SSL Routing**: nginx-ssl handles all HTTPS traffic
- **Development**: nginx-dev disabled (port conflict resolved)
- **Hot Reload**: Enabled on all Node.js services
- **Network**: Single enterprise-network for all containers

### Access Points:
```bash
# Production HTTPS (recommended)
https://cactoos.digital              # Frontend
https://cactoos.digital/api/health   # API

# Development direct access
http://localhost:3000                # Frontend
http://localhost:3100/health         # API
```

## 🎯 Polish B2B/B2C Market Ready

✅ **Enterprise-grade architecture**  
✅ **A+ SSL security configuration**  
✅ **Microservices scalability**  
✅ **Hot reload development** (no restarts needed!)  
✅ **Production monitoring**  

**🌐 System is live and operational at https://cactoos.digital**  
**📋 Complete documentation**: [CLAUDE.md](./CLAUDE.md) • [DEVELOPMENT.md](./DEVELOPMENT.md)