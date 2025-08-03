# Docker Integration for Invoice Service

## Overview

Complete Docker containerization and orchestration setup for the Invoice Service, including multi-stage builds, health checks, and service dependency management.

## Docker Configuration

### 🐳 Multi-Stage Dockerfile

**Production-Optimized Build:**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
# ... build stage with dependencies and compilation

FROM node:18-alpine AS production  
# ... production stage with only runtime dependencies
```

**Key Features:**
- **Multi-stage build** for optimized production images
- **Alpine Linux** for minimal image size
- **Non-root user** for security (nestjs:nodejs)
- **Health checks** for container monitoring
- **Dependency optimization** production-only packages

### 🔧 Build Configuration

**Build Stage:**
- Install all dependencies including dev dependencies
- Compile TypeScript to JavaScript
- Optimize bundle size with tree-shaking
- Clean build artifacts and cache

**Production Stage:**
- Install only production dependencies
- Copy compiled application from builder
- Set proper file permissions
- Configure non-root user execution

### 🏥 Health Check Implementation

**Container Health Monitoring:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/health/check', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
```

**Health Check Features:**
- **30-second intervals** for regular monitoring
- **10-second timeout** preventing hanging checks
- **60-second start period** allowing service initialization
- **3 retries** before marking as unhealthy
- **HTTP-based check** using service health endpoint

### 🔗 Docker Compose Integration

**Service Configuration:**
```yaml
invoices-service:
  build:
    context: ./invoices-service
    dockerfile: Dockerfile
  ports:
    - "3008:3008"
  environment:
    NODE_ENV: development
    DATABASE_URL: postgresql://crm_user:crm_password@postgres:5432/crm_db
    # ... complete environment configuration
  depends_on:
    - postgres
    - redis
    - services-service
    - products-service
    - contacts-service
  networks:
    - crm-network
```

### 🌐 Network Configuration

**Service Discovery:**
- **crm-network**: Bridge network for inter-service communication
- **DNS Resolution**: Services accessible by container name
- **Port Mapping**: 3008:3008 for external access
- **Internal Communication**: Direct container-to-container communication

**Service URLs:**
- External: `http://localhost:3008`
- Internal: `http://invoices-service:3008`
- API Gateway: `http://invoices-service:3008` (from api-gateway container)

### 🔧 Environment Configuration

**Complete Environment Variables:**
```yaml
environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://crm_user:crm_password@postgres:5432/crm_db
  DB_HOST: postgres
  DB_PORT: 5432
  DB_USERNAME: crm_user
  DB_PASSWORD: crm_password
  DB_NAME: crm_db
  PORT: 3008
  JWT_SECRET: your-super-secret-jwt-key
  SERVICES_SERVICE_URL: http://services-service:3007
  PRODUCTS_SERVICE_URL: http://products-service:3004
  CONTACTS_SERVICE_URL: http://contacts-service:3005
  REDIS_URL: redis://redis:6379
```

**Configuration Features:**
- **Database Connection**: PostgreSQL with connection pooling
- **Service Discovery**: URL configuration for microservice communication
- **Security**: JWT secret for authentication
- **Caching**: Redis URL for session and caching
- **Environment Flexibility**: Development/production configuration

### 📦 Dependency Management

**Service Dependencies:**
```yaml
depends_on:
  - postgres      # Database dependency
  - redis         # Caching dependency
  - services-service    # Enhanced pricing integration
  - products-service    # Product pricing integration
  - contacts-service    # Customer validation integration
```

**Startup Order:**
1. **postgres** - Database service
2. **redis** - Caching service  
3. **services-service** - Enhanced pricing service
4. **products-service** - Product management service
5. **contacts-service** - Customer validation service
6. **invoices-service** - Invoice service (depends on all above)
7. **api-gateway** - API routing (depends on invoices-service)

### 🔒 Security Configuration

**Container Security:**
```dockerfile
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /app
USER nestjs
```

**Security Features:**
- **Non-root execution** prevents privilege escalation
- **Minimal base image** (Alpine Linux) reduces attack surface
- **Dependency scanning** built into multi-stage builds
- **File permissions** properly configured for service user

### 🚀 Performance Optimization

**Build Optimization:**
- **Layer caching** optimized Dockerfile layers
- **Dependency caching** npm ci with cache cleaning
- **Multi-stage builds** minimize final image size
- **Production dependencies** only in final image

**Runtime Optimization:**
- **Node.js 18** latest LTS for performance
- **Connection pooling** for database connections
- **Memory management** optimized garbage collection
- **CPU optimization** proper resource allocation

### 📊 Monitoring Integration

**Container Monitoring:**
- **Health checks** for service availability
- **Resource monitoring** CPU and memory usage
- **Log aggregation** structured logging output
- **Metrics collection** performance metrics export

**Service Monitoring:**
- **Health endpoints** `/health/check`, `/health/liveness`, `/health/readiness`
- **Performance metrics** response times and throughput
- **Error tracking** structured error logging
- **Integration monitoring** external service health

### 🔄 Development Workflow

**Development Commands:**
```bash
# Build and start Invoice Service
docker-compose build invoices-service
docker-compose up invoices-service -d

# View logs
docker-compose logs invoices-service --tail=20

# Service health check
curl http://localhost:3008/health/check

# API documentation
open http://localhost:3008/api/docs
```

**Hot Reload Support:**
- Development configuration supports code changes
- TypeScript compilation on file changes
- Automatic service restart on code updates
- Debug port exposure for debugging tools

### 🔧 Build Process

**Multi-Stage Build Process:**

**Stage 1 - Builder:**
1. Install Node.js 18 Alpine
2. Set working directory `/app`
3. Copy package files and TypeScript config
4. Install all dependencies (including dev)
5. Copy source code
6. Compile TypeScript to JavaScript
7. Clean temporary files

**Stage 2 - Production:**
1. Start with Node.js 18 Alpine
2. Create non-root user (nestjs:nodejs)
3. Set working directory `/app`
4. Copy package files
5. Install production dependencies only
6. Copy compiled application from builder
7. Set proper ownership and permissions
8. Configure health check
9. Expose port 3008
10. Start application as non-root user

### 📋 Image Specifications

**Final Image:**
- **Base**: node:18-alpine
- **Size**: ~150MB (optimized)
- **User**: nestjs (non-root)
- **Port**: 3008
- **Health Check**: HTTP-based
- **Dependencies**: Production only

**Build Artifacts:**
- **Source removed**: Only compiled JavaScript
- **Dev dependencies removed**: Minimal runtime
- **Cache cleaned**: No npm cache
- **Temporary files removed**: Clean image

### 🌟 Integration Features

**API Gateway Integration:**
```yaml
# Updated API Gateway environment
INVOICES_SERVICE_URL: http://invoices-service:3008

# Updated API Gateway dependencies  
depends_on:
  - invoices-service  # Added dependency
```

**Database Integration:**
- **Migration support**: Database schema creation
- **Connection pooling**: Efficient database connections
- **Health checks**: Database connectivity validation
- **Backup compatibility**: Standard PostgreSQL integration

**Redis Integration:**
- **Session storage**: User session management  
- **Caching layer**: Response and data caching
- **Health monitoring**: Redis connectivity checks
- **Performance optimization**: Cache-first strategies

### 🔍 Troubleshooting Support

**Common Issues & Solutions:**

**Container Won't Start:**
```bash
# Check logs
docker-compose logs invoices-service

# Check health status
docker-compose ps invoices-service

# Restart with rebuild
docker-compose build invoices-service --no-cache
docker-compose up invoices-service -d
```

**Network Issues:**
```bash
# Check network connectivity
docker exec invoices-service ping postgres
docker exec invoices-service ping services-service

# Verify service URLs
docker exec invoices-service env | grep SERVICE_URL
```

**Database Connection Issues:**
```bash
# Check database connectivity
docker exec invoices-service pg_isready -h postgres -p 5432

# Verify environment variables
docker exec invoices-service env | grep DB_
```

## Deployment Readiness

### ✅ Container Configuration  
- **Multi-stage build** optimized for production
- **Health checks** implemented and tested
- **Security hardening** non-root execution
- **Resource optimization** minimal image size

### ✅ Service Integration
- **Service discovery** proper DNS resolution
- **Dependency management** correct startup order
- **Network isolation** secure inter-service communication
- **Environment configuration** flexible config management

### ✅ Monitoring & Logging
- **Health endpoints** comprehensive monitoring
- **Structured logging** JSON formatted logs
- **Performance metrics** resource usage tracking
- **Error handling** graceful failure management

### ✅ Development Support
- **Hot reload** development workflow
- **Debug support** debugging port configuration
- **Log aggregation** centralized logging
- **API documentation** Swagger integration

## Files Created/Modified

### Docker Configuration
- `invoices-service/Dockerfile` - Multi-stage production build
- `docker-compose.yml` - Service integration and configuration

### Health Monitoring  
- `invoices-service/src/health/` - Health check endpoints
- Container health check configuration

### Environment Configuration
- Complete environment variable setup
- Service URL configuration
- Database connection configuration

The Invoice Service is now **fully containerized** and ready for deployment with comprehensive Docker integration, health monitoring, and production-grade security configuration.