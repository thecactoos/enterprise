# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Status: Development Environment

**IMPORTANT: Use development environment (`docker-compose.dev.yml`) for all changes and testing.**

This is a **production-ready microservices CRM system** for the Polish B2B/B2C market, deployed on a **private VPS** at https://cactoos.digital.

### Key Features:
- **Infrastructure**: Private VPS (178.63.69.38) with full root access
- **Domain**: https://cactoos.digital - Live production system
- **SSL/HTTPS**: A+ grade security with Let's Encrypt auto-renewal
- **Architecture**: Microservices with NestJS + React + PostgreSQL
- **Polish Market**: Full support for NIP, REGON, Polish addresses, PLN currency
- **Development**: Hot reload enabled for ALL microservices
- **Frontend**: Next.js 15 with shadcn/ui components (modern React framework)

### Production Features:
1. ✅ **Contact Management** - Unified leads/clients system with Polish business validation
2. ✅ **Authentication** - JWT-based auth with role management
3. ✅ **Product Catalog** - 70,000+ flooring/construction products imported
4. ✅ **Quote Generation** - Advanced quote builder with multi-quote support
5. ✅ **Services Catalog** - Flooring services with advanced pricing models
6. ✅ **Invoice Management** - Polish invoice system with VAT calculations
7. ✅ **OCR Processing** - Document analysis and data extraction
8. ✅ **Notes System** - Contact activity tracking
9. ✅ **AI Integration** - OpenAI-powered features in API Gateway
10. ✅ **Infrastructure** - Enterprise-grade deployment with monitoring

## 📋 Current Architecture

### Production URLs (Private VPS: 178.63.69.38):
- **Frontend (Next.js)**: https://cactoos.digital (port 3000)
- **API Gateway**: https://cactoos.digital/api/ (internal port 3100)
- **Health Check**: https://cactoos.digital/api/health
- **pgAdmin (Database)**: https://cactoos.digital/pgadmin/ 🔐
- **Portainer (Containers)**: https://cactoos.digital/portainer/ 🔐

### Development Environment URLs (PRIMARY):
- **Frontend**: http://localhost:3000 or http://178.63.69.38:3000
- **API Gateway**: http://localhost:3100 or http://178.63.69.38:3100
- **Health Check**: http://localhost:3100/health
- **pgAdmin**: http://localhost:5050 or http://178.63.69.38:5050
- **Portainer**: http://localhost:9000 or http://178.63.69.38:9000

### Microservices Architecture (All with Hot Reload):
- `api-gateway` (port 3100→3000) ✅ Hot Reload ✅ Healthy - Central routing, auth, business logic
- `ai-service` (port 3008) ✅ Hot Reload ✅ Healthy - **NEW** OpenAI integration, OCR analysis, document processing
- `users-service` (port 3003) ✅ Hot Reload ✅ Healthy - User management and authentication
- `contacts-service` (port 3004) ✅ Hot Reload 🔄 Building - Unified contact/lead management  
- `products-service` (port 3005) ✅ Hot Reload 🔄 Building - Product catalog (70,000+ items)
- `notes-service` (port 3006) ✅ Hot Reload 🔄 Building - Notes and activity tracking
- `services-service` (port 3001) ✅ Hot Reload ✅ Healthy - Service definitions with pricing
- `quotes-service` (port 3002) ✅ Hot Reload ⚠️ Unhealthy - Quote generation and management
- `invoices-service` (port 3007) ✅ Hot Reload 🔄 Building - Invoice processing with Polish VAT
- `ocr-service` (port 8000) ✅ Healthy - Python-based OCR document processing with Polish support
- `frontend-next` (port 3000) ✅ Hot Reload ✅ Healthy - Next.js 15 with shadcn/ui (Primary Frontend)
- `nginx-ssl` (ports 80/443) ✅ Healthy - HTTPS termination and routing to services

### Health Check Status:
```bash
# Quick health check command
docker compose -f docker-compose.dev.yml ps | grep "healthy\|unhealthy"

# Detailed service health endpoints
curl -s http://178.63.69.38:3100/health | jq .  # API Gateway
curl -s http://178.63.69.38:3008/health | jq .  # AI Service  
curl -s http://178.63.69.38:3003/health | jq .  # Users Service
curl -s http://178.63.69.38:8000/health | jq .  # OCR Service
```

### Infrastructure:
- **Database**: PostgreSQL 15 with health checks and automated backups
- **Reverse Proxy**: Nginx SSL (production) - handles HTTPS termination and routing
- **SSL**: Let's Encrypt with auto-renewal (cron every 12h)
- **Monitoring**: pgAdmin, Portainer, custom health monitoring
- **Orchestration**: Docker Compose with multiple environment configs
- **Caching**: Redis support in API Gateway (port 6379)
- **File Storage**: Local volumes for OCR uploads
- **Port Management**: Automatic port conflict resolution

## 🤖 AI Service (NEW)

### **OpenAI Integration**:
- **Service**: Standalone microservice on port 3008
- **Model**: GPT-4o-mini (cost-effective GPT-4 variant)
- **Features**: OCR analysis, entity recognition, document classification
- **Language**: Optimized for Polish business documents

### **API Endpoints**:
```
POST /ai/analyze-ocr    - Analyze OCR text with AI
GET  /ai/health         - AI service health check
GET  /ai/models         - Available OpenAI models
GET  /health            - Service health status
GET  /docs              - Swagger documentation
```

### **Architecture**:
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ api-gateway │───▶│ ai-service  │───▶│ OpenAI API  │
│ (port 3100) │    │ (port 3008) │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐    ┌─────────────┐
│ ocr-service │    │ Frontend    │
│ (port 8000) │    │ (port 3000) │
└─────────────┘    └─────────────┘
```

### **Usage Example**:
```bash
# Health check
curl http://localhost:3008/ai/health

# OCR Analysis (Polish invoice)
curl -X POST http://localhost:3008/ai/analyze-ocr \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Faktura VAT nr FV/2025/001...",
    "filename": "invoice.pdf",
    "documentType": "invoice"
  }'
```

## 🔧 Development Setup

### 🔥 Hot Reload Development (No Restarts Required):
**ALL microservices** have hot reload enabled - **NEVER restart Docker Compose for code changes**:

#### ✅ Services with Live Code Updates:
- **NestJS services**: Using `npx nest start --watch` - TypeScript changes reload instantly
- **Next.js frontend**: Built-in hot reload - React components update without page refresh
- **API Gateway**: Hot reload enabled - route changes, middleware updates apply instantly
- **All microservices**: Code changes detected automatically within seconds

#### 🚀 Development Workflow:
1. **Start once**: `docker compose -f docker-compose.dev.yml up -d`
2. **Make changes**: Edit any TypeScript, React, or configuration file
3. **Save file**: Changes apply automatically (2-5 seconds)
4. **Test immediately**: No container restarts, no build steps required

#### 🎯 What Hot Reload Covers:
- ✅ TypeScript/JavaScript code changes
- ✅ React component updates
- ✅ API route modifications
- ✅ Environment variable changes (in most cases)
- ✅ CSS/styling updates
- ✅ Database model changes (with TypeORM)

#### ⚠️ Only Restart When:
- Adding new npm dependencies (`package.json` changes)
- Docker configuration changes (`Dockerfile`, `docker-compose.yml`)
- New service additions
- Database schema migrations (structural changes)

### Essential Commands:
```bash
# Start development (run ONCE - hot reload handles the rest) - PRIMARY ENVIRONMENT
docker compose -f docker-compose.dev.yml up -d

# Production environment (with SSL) - ONLY for production deployment
docker compose -f docker-compose.ssl.yml up -d

# Check service status
docker compose -f docker-compose.dev.yml ps

# View live logs (useful for debugging hot reload)
docker compose -f docker-compose.dev.yml logs -f [service-name]

# Only restart if you change package.json or Docker config
docker compose -f docker-compose.dev.yml restart [service-name]

# Database backup
./backup.sh

# SSL certificate renewal (runs automatically)
./setup-ssl.sh
```

### ⚡ Hot Reload Workflow:
```bash
# Day 1: Start your environment
docker compose -f docker-compose.dev.yml up -d

# Days 2-N: Just edit files and save
vim api-gateway/src/users/users.controller.ts  # Changes apply instantly
vim frontend-next/app/dashboard/page.tsx        # Hot module replacement
vim products-service/src/products/products.service.ts  # Auto-reload

# No docker commands needed for regular development!
```

### Environment Files:
- `.env.dev` - Development environment variables
- `.env.prod` - Production environment variables
- Individual service `.env` files in each service directory

## 🔒 Security & SSL

### SSL Configuration:
- **Grade**: A+ (SSL Labs)
- **Protocols**: TLS 1.2, TLS 1.3
- **HSTS**: Enabled with preload
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options
- **Auto-renewal**: Cron job every 12 hours
- **Certificate**: Let's Encrypt via Certbot

### Security Features:
- **Rate Limiting**: API (100/min), Auth (20/min), OCR (10/min)
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Polish business validators (NIP, REGON)
- **SQL Injection Protection**: TypeORM with parameterized queries
- **XSS Protection**: Security headers and input sanitization
- **CORS**: Configured for production domain
- **File Upload**: Size limits and type validation for OCR

## 🎯 Architecture Layers

### Nginx (Infrastructure Layer):
- SSL termination and certificate management
- Static asset serving with caching
- Rate limiting per endpoint
- Security headers injection
- Request/response compression (gzip)
- Reverse proxy to API Gateway

### API Gateway (Business Logic Layer):
- JWT authentication and authorization
- Request routing to microservices
- Business logic orchestration
- Response transformation and caching
- Polish validation decorators
- Error handling and logging

### AI Service (Intelligence Layer):
- **OpenAI Integration**: GPT-4o-mini for document analysis
- **OCR Analysis**: Polish business document processing
- **Entity Recognition**: NIP, REGON, companies, amounts, dates
- **Document Classification**: invoices, contracts, letters, reports
- **Semantic Understanding**: topics extraction and action items
- **Polish Language**: Optimized for Polish B2B documents

### Microservices (Domain Layer):
- Single responsibility per service
- Independent databases (when needed)
- Inter-service communication via HTTP
- Health checks and monitoring
- Automated testing support

## 📁 Project Structure (Private VPS)

```
/var/www/enterprise/                 # Root directory on VPS
├── api-gateway/          ✅ Hot Reload - Central API (port 3100→3000)
├── ai-service/           ✅ Hot Reload - **NEW** OpenAI integration (port 3008)
├── frontend-next/        ✅ Hot Reload - Next.js 15 app (port 3000)
├── frontend-legacy/      📁 Legacy - Old React SPA (deprecated)
├── nginx/               🔒 SSL/HTTPS - nginx-ssl for production routing
├── users-service/        ✅ Hot Reload - User management
├── contacts-service/     ✅ Hot Reload - Contact management
├── products-service/     ✅ Hot Reload - Product catalog
├── notes-service/        ✅ Hot Reload - Notes system
├── services-service/     ✅ Hot Reload - Service definitions
├── quotes-service/       ✅ Hot Reload - Quote generation
├── invoices-service/     ✅ Hot Reload - Invoice management
├── ocr-service/          ⚠️  No Hot Reload - Python OCR service
├── database/            # SQL schemas and migrations
├── nginx/              # Nginx configurations
├── monitoring/         # Monitoring scripts and tools
├── scripts/            # Utility and import scripts
└── docker-compose.*.yml # Environment configurations
```

## 🛠 Development Guidelines

### When Making Changes:
1. **Hot Reload**: Changes to Node.js services auto-reload
2. **Database Migrations**: Place in `database/migrations/`
3. **Environment Variables**: Update `.env.dev` or `.env.prod`
4. **Polish Features**: Use validators in `api-gateway/src/common/validators/`
5. **Testing**: Run tests before deploying to production

### Code Style:
- **TypeScript**: Strict mode enabled
- **NestJS**: Follow NestJS conventions
- **Next.js**: App Router with React Server Components
- **React**: Functional components with hooks
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: PostgreSQL with TypeORM

### Important Files:
- `DEVELOPMENT.md` - Development setup guide
- `DEPLOYMENT.md` - Production deployment instructions
- `PRODUCTION-STATUS.md` - Current production status
- `REMOTE-SETUP.md` - Remote development configuration

## 🚨 Common Issues & Solutions

### Hot Reload Not Working:
```bash
# Check if service is running
docker compose -f docker-compose.dev.yml ps

# View logs to see hot reload status
docker compose -f docker-compose.dev.yml logs -f [service-name]

# Look for: "webpack compiled" or "File change detected. Starting incremental compilation..."
```

### When to Actually Restart Services:
```bash
# Added new npm package
docker compose -f docker-compose.dev.yml restart [service-name]

# Changed Docker configuration
docker compose -f docker-compose.dev.yml up -d --force-recreate [service-name]

# Service completely stuck (rare)
docker compose -f docker-compose.dev.yml restart [service-name]
```

### Service Not Starting:
```bash
# Check logs
docker compose -f docker-compose.dev.yml logs [service-name]

# Only restart if hot reload isn't the issue
docker compose -f docker-compose.dev.yml restart [service-name]
```

### Health Check Issues:
```bash
# Check all microservice health status
curl -s http://178.63.69.38:3100/health  # API Gateway
curl -s http://178.63.69.38:3008/health  # AI Service  
curl -s http://178.63.69.38:3003/health  # Users Service
curl -s http://178.63.69.38:8000/health  # OCR Service

# Check container health status
docker compose -f docker-compose.dev.yml ps

# Common health check problems:
# 1. Missing /health endpoint in service code
# 2. Wrong HTTP method (HEAD vs GET) in docker healthcheck
# 3. Service not fully initialized (downloading models, etc.)

# Fix healthcheck for FastAPI services (use GET instead of HEAD):
# OLD: ["CMD", "wget", "--spider", "http://0.0.0.0:8000/health"]
# NEW: ["CMD", "wget", "-O", "/dev/null", "http://0.0.0.0:8000/health"]

# Add health module to NestJS services:
# 1. Create health/ directory with controller, service, module
# 2. Import HealthModule in app.module.ts
# 3. Implement basic health check with database connectivity
```

### Database Connection Issues:
```bash
# Check PostgreSQL status
docker compose -f docker-compose.dev.yml ps postgres

# Reset database (WARNING: loses data)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

### SSL Certificate Issues:
```bash
# Manually renew certificates
./setup-ssl.sh

# Check certificate status
docker exec nginx-ssl certbot certificates
```

### Nginx Configuration Issues:
```bash
# Check nginx-ssl status (should be running)
docker compose -f docker-compose.ssl.yml ps nginx-ssl

# nginx-dev conflicts with nginx-ssl (both use port 80)
# Solution: Use nginx-ssl only, disable nginx-dev
docker compose -f docker-compose.dev.yml stop nginx-dev

# Test routing through nginx-ssl
curl -s https://cactoos.digital/api/health
curl -s -I https://cactoos.digital  # Should redirect to login

# Restart nginx-ssl if container links are broken
docker compose -f docker-compose.ssl.yml restart nginx-ssl
```

### Port Conflict Resolution:
```bash
# Check for port conflicts
docker ps | grep ":80\|:3000\|:3100"

# Current port mapping (after fixes):
# - Frontend Next.js: 3000
# - API Gateway: 3100 (external) → 3000 (internal)
# - Nginx SSL: 80/443

# Force recreate containers with new ports
docker compose -f docker-compose.dev.yml up -d --force-recreate api-gateway frontend-next
```

## 🔄 Deployment Workflow

1. **Development**: Make changes with hot reload
2. **Testing**: Run automated tests
3. **Commit**: Push to repository
4. **Deploy**: Use deployment scripts
5. **Monitor**: Check health endpoints

## 🔧 Advanced Hot Reload Troubleshooting

### ✅ Verify Hot Reload is Working:
```bash
# Check compilation logs
docker compose -f docker-compose.dev.yml logs -f api-gateway | grep -i "compil"

# Should see: "File change detected. Starting incremental compilation..."
# Followed by: "webpack compiled successfully"

# Test with simple change
echo "// Hot reload test" >> api-gateway/src/main.ts
# Watch for automatic restart in logs
```

### 🚨 Hot Reload Troubleshooting Steps:

#### 1. Service Status Check:
```bash
# All services should show "Up" and "healthy"
docker compose -f docker-compose.dev.yml ps

# Check specific service health
docker inspect enterprise-api-gateway-dev --format='{{.State.Health.Status}}'
```

#### 2. Volume Mount Verification:
```bash
# Verify file sync is working
docker exec enterprise-api-gateway-dev ls -la /app/src/

# Test file changes reach container
echo "test" > api-gateway/src/test.txt
docker exec enterprise-api-gateway-dev cat /app/src/test.txt
rm api-gateway/src/test.txt
```

#### 3. Hot Reload Performance Issues:
```bash
# If compilation is slow, check container resources
docker stats enterprise-api-gateway-dev

# Clear Node.js cache if needed
docker exec enterprise-api-gateway-dev rm -rf /app/.next
docker exec enterprise-api-gateway-dev rm -rf /app/node_modules/.cache
```

### 🔄 When Restarts ARE Required:

#### Package Dependencies:
```bash
# After npm install/update
npm install express-rate-limit
docker compose -f docker-compose.dev.yml restart api-gateway

# After changing package.json
vim package.json  # Add new script
docker compose -f docker-compose.dev.yml restart [service-name]
```

#### Environment & Configuration:
```bash
# Docker compose file changes
vim docker-compose.dev.yml
docker compose -f docker-compose.dev.yml up -d --force-recreate

# Dockerfile changes
vim api-gateway/Dockerfile.dev
docker compose -f docker-compose.dev.yml up -d --build api-gateway

# New environment variables
vim .env.dev
docker compose -f docker-compose.dev.yml up -d [service-name]
```

#### Service Recovery:
```bash
# Container completely unresponsive
docker compose -f docker-compose.dev.yml restart [service-name]

# Memory/resource exhaustion
docker compose -f docker-compose.dev.yml down
docker system prune
docker compose -f docker-compose.dev.yml up -d
```

### 🎯 Hot Reload Performance Metrics:
- **TypeScript compilation**: 2-5 seconds
- **Next.js HMR**: <1 second (preserves React state)
- **API endpoint changes**: 3-5 seconds
- **Database model updates**: 2-4 seconds
- **CSS/styling changes**: <1 second

### ⚡ Optimization Tips:
```bash
# Exclude unnecessary files from hot reload
# Already configured in .dockerignore and volume mounts

# Monitor compilation performance
docker compose -f docker-compose.dev.yml logs -f api-gateway | grep -E "compil|webpack"

# Check Docker resource usage
docker system df
docker stats --no-stream
```

## 🔧 MCP (Model Context Protocol) Integration

### **Claude Code Enhancement Stack**:
The enterprise environment includes production-ready MCP servers for enhanced Claude Code capabilities:

#### ✅ **Installed MCP Servers**:
- **Memory Server** - Persistent project knowledge across sessions
- **Sequential Thinking Server** - Structured problem-solving workflows  
- **PostgreSQL Server** - Direct database operations and analysis
- **Filesystem Server** - Secure file operations within project directory
- **Everything Server** - Comprehensive tooling for testing and development
- **🤖 Enterprise Agents Server** - **NEW** Specialized development agents

#### 🚀 **Enterprise Development Agents** (✨ **TIER 1 ACTIVE**):
- **Backend Architect** (Sonnet) - RESTful APIs, microservices, database design
- **Frontend Developer** (Sonnet) - React components, responsive design, state management  
- **Code Reviewer** (Sonnet) - Security analysis, code quality, configuration safety
- **Test Automator** (Sonnet) - Unit/integration/E2E tests, CI/CD pipelines

#### 📁 **MCP Configuration Location**:
```
/var/www/enterprise/.claude/
├── claude_desktop_config.json  # MCP server configuration
├── setup-mcp.sh               # Installation script
├── agents-server.js            # Custom agents MCP server
├── agents/                     # Agent definitions (from wshobson/agents)
├── agents-setup.md            # Agent implementation strategy
├── agents-usage.md            # Agent usage documentation
├── README.md                   # MCP documentation
├── memory/                     # Persistent knowledge storage
└── logs/                       # MCP server logs
```

#### 🚀 **Setup MCP Servers**:
```bash
cd /var/www/enterprise/.claude
./setup-mcp.sh

# Copy config to Claude Desktop (when available):
# macOS: ~/Library/Application Support/Claude/claude_desktop_config.json  
# Windows: %APPDATA%/Claude/claude_desktop_config.json
# Linux: ~/.config/Claude/claude_desktop_config.json
```

#### 💡 **Usage Examples**:
```
# Database Operations
"Show me the schema for the contacts table"
"Analyze performance of recent user queries"

# Enterprise Agents (NEW)
"Use the backend-architect agent to review our microservices structure"
"Use the frontend-developer agent to create a responsive contact form"
"Use the code-reviewer agent to analyze security vulnerabilities in authentication"
"Use the test-automator agent to improve test coverage for the OCR service"
# Memory Operations  
"Remember this architecture decision for future reference"
"What coding patterns have we established for this project?"

# Problem Solving
"Help me debug this authentication issue step by step"
"Analyze the impact of changing the database schema"
```

## 📞 Support & Documentation

### VPS Access:
- **Server IP**: 178.63.69.38 (Private VPS)
- **Production URL**: https://cactoos.digital
- **Health Check**: https://cactoos.digital/api/health
- **Documentation**: See `/docs` folder for detailed guides
- **MCP Documentation**: See `/.claude/README.md` for MCP setup
- **Enterprise Agents Guide**: See `/.claude/agents-usage.md` for agent usage patterns

#### 🎯 **Agent Usage Strategy**:
- **Daily Development**: Use Backend Architect + Frontend Developer for feature development
- **Code Quality**: Use Code Reviewer for every commit and PR review
- **Testing**: Use Test Automator proactively for test coverage improvement
- **Security**: Use Code Reviewer for configuration changes and security analysis
- **Cost Optimization**: All Tier 1 agents use Sonnet model (balanced cost/performance)

### VPS Specifications:
- **Location**: Private VPS with full root access
- **OS**: Linux (Ubuntu/Debian)
- **Resources**: Dedicated CPU, RAM, and storage
- **Network**: Static IP with configured firewall
- **Access**: SSH with key-based authentication

### Quick Development Health Check:
```bash
# Verify entire hot reload system
curl https://cactoos.digital/api/health  # API responsive
echo "// Test" >> api-gateway/src/main.ts  # File change
docker compose -f docker-compose.dev.yml logs -f api-gateway --tail 10  # Watch reload
# Should see compilation complete within 5 seconds
```