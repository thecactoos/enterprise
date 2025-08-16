# Changelog

All notable changes to the Enterprise CRM system will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2025-08-12

### 🤖 AI Service Microservice Migration

### ✅ Added
- **New AI Service**: Standalone microservice on port 3008 with hot reload
- **OpenAI GPT-4o-mini**: Advanced document analysis and entity recognition
- **Polish Business Documents**: Optimized for NIP, REGON, invoices, contracts
- **Swagger Documentation**: Interactive API docs at `/docs` endpoint
- **Health Monitoring**: Detailed health checks with OpenAI connection status
- **Entity Recognition**: Automatic extraction of companies, amounts, dates, contacts
- **Document Classification**: Intelligent categorization (invoice, contract, letter, etc.)
- **Semantic Analysis**: Topics extraction and action items generation

### 🔧 Changed
- **API Gateway**: Removed direct OpenAI integration, now uses HTTP client to ai-service
- **Architecture**: Clean separation of AI functionality into dedicated microservice
- **OCR Integration**: Updated to communicate with ai-service for intelligent analysis
- **Dependencies**: Moved OpenAI SDK from api-gateway to ai-service
- **Documentation**: Updated CLAUDE.md with new AI service architecture

### 🚀 Benefits
- **Independent Scaling**: AI service can be scaled separately from main application
- **Resource Isolation**: AI processing doesn't impact other microservices
- **Cost Optimization**: Dedicated monitoring and rate limiting for OpenAI usage
- **Development Efficiency**: Hot reload enabled for rapid AI feature development

### 📋 API Endpoints
```
POST /ai/analyze-ocr    - Analyze OCR text with AI
GET  /ai/health         - AI service health check  
GET  /ai/models         - Available OpenAI models
GET  /health            - Service health status
GET  /docs              - Swagger documentation
```

### 🔄 Migration Notes
- AI functionality seamlessly moved from api-gateway to dedicated ai-service
- All existing OCR analysis endpoints continue to work unchanged
- Enhanced Polish language support with improved entity recognition
- Backward compatible with existing integrations

## [1.2.0] - 2025-08-12

### 🎉 Major Changes
- **Migrated to Next.js 15** as primary frontend (replaced React SPA)
- **Added pgAdmin & Portainer domain access** through HTTPS
- **Fixed nginx port conflicts** and optimized routing
- **Enhanced hot reload documentation** with troubleshooting

### ✅ Added
- Next.js 15 frontend with shadcn/ui components and Tailwind CSS
- pgAdmin accessible at `https://cactoos.digital/pgadmin/`
- Portainer accessible at `https://cactoos.digital/portainer/`
- Production Dockerfile for Next.js with multi-stage builds
- Comprehensive nginx troubleshooting documentation
- Hot reload performance metrics and optimization tips
- Port conflict resolution procedures

### 🔧 Changed
- **API Gateway**: Moved from port 3000 to 3100 (external) → 3000 (internal)
- **Frontend**: Next.js now on port 3000 (primary frontend)
- **nginx-dev**: Disabled due to port 80 conflict with nginx-ssl
- **Documentation**: Updated all .md files with current port configurations
- **Container networking**: Enhanced inter-service communication

### 🐛 Fixed
- **nginx-dev container exits** - Resolved port 80 conflict with nginx-ssl
- **502 Bad Gateway errors** - Fixed nginx-ssl container links to updated services
- **Port conflicts** - Implemented proper port management strategy
- **Hot reload issues** - Added troubleshooting guides and verification steps

### 🔒 Security
- **pgAdmin reverse proxy** - Added HTTPS access with proper headers
- **Portainer HTTPS access** - Secure container management through domain
- **nginx-ssl optimization** - Improved routing and security headers
- **Container isolation** - Enhanced network security

### 📚 Documentation Updates
- **CLAUDE.md**: Added nginx troubleshooting, port configurations, and development workflow
- **README.md**: Updated microservices architecture and access points
- **DEVELOPMENT.md**: Enhanced hot reload guides and nginx configuration explanations
- **Production URLs**: Updated all documentation with current service endpoints

### 🏗️ Infrastructure
- **Docker Compose**: Optimized service dependencies and health checks
- **nginx SSL**: Enhanced routing configuration for admin panels
- **Service Discovery**: Improved container-to-container communication
- **Health Monitoring**: Added comprehensive service status checks

### 🚀 Performance
- **Hot Reload**: All Node.js services support instant code updates
- **Compilation Time**: Next.js HMR <1 second, TypeScript compilation 2-5 seconds
- **Network Optimization**: Improved nginx routing and caching
- **Resource Usage**: Optimized container resource allocation

---

## [1.1.0] - 2025-08-04

### Added
- SSL/HTTPS with Let's Encrypt (A+ grade)
- Enterprise-grade nginx configuration
- Polish market features (NIP, REGON, VAT)
- 70,000+ product catalog import
- OCR document processing service
- Redis caching layer
- Comprehensive monitoring setup

### Changed
- Migrated from HTTP to HTTPS
- Enhanced security headers
- Improved database schema
- Optimized microservices communication

### Fixed
- SSL certificate auto-renewal
- Database connection pooling
- Service health checks
- Hot reload stability

---

## [1.0.0] - 2025-07-XX

### Added
- Initial microservices architecture
- Basic authentication system
- Contact management system
- Product catalog foundation
- Quote generation system
- PostgreSQL database setup
- Docker orchestration
- Basic nginx reverse proxy

### Infrastructure
- Docker Compose setup
- PostgreSQL 15 database
- Redis caching
- Basic monitoring with pgAdmin and Portainer
- Development hot reload configuration

---

## Development Workflow

### How to Update This Changelog

When making changes to the system:

1. **Document changes** in the appropriate section (Added, Changed, Fixed, Security)
2. **Use semantic versioning** for releases
3. **Include dates** in ISO format (YYYY-MM-DD)
4. **Reference issues/PRs** when applicable
5. **Group related changes** under clear headings

### Change Categories

- **Added** for new features
- **Changed** for changes in existing functionality  
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

### Version Format

- **Major.Minor.Patch** (e.g., 1.2.0)
- **Major**: Breaking changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible