# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Project Status: MVP Development

This is an **MVP (Minimum Viable Product)** of a microservices-based CRM system being developed with focus on:
- **Core functionality only** - Essential features for business value
- **Quick iterations** - Rapid development and deployment cycles
- **User validation** - Early feedback from Polish B2C/B2B market
- **Simplified workflows** - 2-step lead forms, basic CRUD operations
- **Polish market requirements** - NIP, REGON, Polish addresses, PLN currency

### MVP Priorities:
1. ✅ Contact management (unified leads/clients system) - **Minimal validation fixed (firstName + lastName only)**
2. ✅ Basic authentication 
3. ✅ Product catalog (flooring/construction)
4. 🔄 Quote generation system (partially implemented)
5. ✅ Services catalog (flooring services)
6. ⏳ PDF processing (future phase)
7. ⏳ Advanced analytics (future phase)

## System Architecture

This is a **microservices-based CRM system** with Polish documentation. The system consists of multiple NestJS services, a React frontend, and a Python FastAPI PDF processing service, all orchestrated via Docker Compose.

### Key Services:
- **API Gateway** (NestJS, Port 3000) - Main entry point, JWT auth, request routing ✅ **OPERATIONAL**
- **Users Service** (NestJS, Port 3001) - User management and authentication ✅ **OPERATIONAL** (Fixed network binding)
- **Notes Service** (NestJS, Port 3003) - Notes linked to clients ✅ **OPERATIONAL**
- **Products Service** (NestJS, Port 3004) - Product management ✅ **OPERATIONAL** (Fixed network binding, 3450+ products)
- **Contacts Service** (NestJS, Port 3005) - Unified contact management (leads + clients) ✅ **OPERATIONAL** (Comprehensive Polish business context)
- **Quotes Service** (NestJS, Port 3006) - Quote generation and management ⚠️ **PARTIALLY OPERATIONAL** (Service runs, API Gateway connection issues)
- **Services Service** (NestJS, Port 3007) - Flooring services catalog ✅ **OPERATIONAL** (Service definitions and pricing)
- **PDF Service** (Python/FastAPI, Port 8000) - PDF analysis with OCR ⚠️ **COMMENTED OUT**
- **Frontend** (React + Material UI, Port 3333) - User interface ⚠️ **COMMENTED OUT** (Port updated to avoid conflict)
- **PostgreSQL** (Port 5432) - Main database with UUID primary keys ✅ **OPERATIONAL**
- **Redis** (Port 6379) - Caching and session storage ✅ **OPERATIONAL**

### Data Flow:
Frontend → API Gateway → Individual Microservices → PostgreSQL
PDF uploads go through API Gateway to PDF Service for OCR processing

## Development Commands

### Full System (Docker Compose - Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs
docker-compose logs <service-name>

# Stop all services
docker-compose down

# Rebuild and restart (fixed Docker build issues)
docker-compose build <service-name> --no-cache
docker-compose up <service-name> -d
```

### Creating New Microservices with Hot Reload in Docker

**Standard workflow for developing any new microservice:**

```bash
# 1. Create new NestJS service directory
mkdir new-service && cd new-service
npm init -y
npm install @nestjs/core @nestjs/common @nestjs/platform-express

# 2. Set up proper TypeScript configuration
# - Create tsconfig.json with proper outDir: "./dist"
# - Create tsconfig.build.json extending main config
# - Ensure no .d.ts files in src/ directory

# 3. Create Dockerfile with multi-stage build
# - Builder stage: installs deps + builds TypeScript
# - Production stage: copies only dist/ and production deps
# - Use 0.0.0.0 binding for Docker compatibility

# 4. Add service to docker-compose.yml
# - Expose appropriate port
# - Add database and Redis dependencies
# - Configure environment variables

# 5. Development workflow with hot reload:
docker-compose build new-service
docker-compose up new-service -d
docker-compose logs new-service --tail=20

# 6. Test service health check
curl http://localhost:PORT/health/check
```

**Key Development Patterns:**
- Always use `0.0.0.0` binding, never `localhost` in main.ts
- Clean dist/ directory before builds to avoid TS5055 errors
- Use proper validation DTOs with `@IsOptional()` for optional fields
- Include comprehensive Swagger documentation
- Implement health check endpoint for monitoring

**Common Issues and Solutions:**
- **TS5055 Error**: Remove all .d.ts files from src/ → `find src -name "*.d.ts" -delete`
- **Docker Build Timeout**: Use `docker system prune -f` to clean cache
- **Module Not Found**: Ensure proper tsconfig.json with `outDir: "./dist"`
- **Network Binding**: Always bind to `0.0.0.0:PORT` not `localhost:PORT`
- **Validation Errors**: Use `@Transform()` and `@ValidateIf()` for complex optional fields

### Individual Services (Development)

#### API Gateway
```bash
cd api-gateway
npm install
npm run start:dev      # Development with watch
npm run build         # Production build
npm run test          # Run tests
npm run lint          # ESLint
```

#### Other NestJS Services (users-service, notes-service, products-service, contacts-service, quotes-service, services-service)
```bash
cd <service-directory>
npm install
npm run start:dev
npm run build
npm run test
npm run lint          # ESLint
npm run format        # Prettier formatting
```

#### PDF Service (Python)
```bash
cd pdf-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Alternative start methods
python main.py
./start.sh  # Unix/Linux
start.bat   # Windows
```

#### Frontend
```bash
cd frontend
npm install
npm start            # Development server
npm run build        # Production build
npm test             # Run tests
```

## Mock Data vs Real API System

The frontend implements a **dual-mode system** for development flexibility:

### Mock Data Mode (Default for Development)
- Use when building UI components rapidly
- Toggle via DevTools panel in browser
- Environment variable: `USE_MOCK_DATA=true`
- Sample data includes 5 clients, 5 notes, 3 users with realistic relationships

### Real API Mode
- Switch via DevTools panel or set `USE_MOCK_DATA=false`
- Used for integration testing and production
- Requires backend services to be running

**Key Point**: Always test components first with mock data, then validate with real API integration.

## Database Architecture

### Schema Structure (PostgreSQL)
- **UUID-based primary keys** across all tables
- **Foreign key relationships**: notes → clients, notes → users
- **Automatic timestamps**: createdAt, updatedAt with triggers
- **Performance indexes** on frequently queried columns
- **Database views** for client_stats and user_activity

### Key Tables:
- `users` - Authentication and user profiles (admin/user roles)
- `contacts` - Unified contact management (leads + clients) with comprehensive Polish business context
- `notes` - Notes linked to contacts and users with importance flags
- `products` - Complex product catalog with Polish business domain (flooring/construction)
- `quotes` - Quote generation and management with service integration
- `services` - Flooring services catalog with pricing and descriptions

### Products Schema Details:
- **Categories**: flooring, molding, accessory, panel, profile, other
- **Unit Management**: Support for multiple unit types (mm, m, m², piece) and conversions
- **Pricing Structure**: Retail, selling, and purchase prices with profit calculations
- **Dimensions**: Thickness, width, length in millimeters with computed display strings
- **Business Logic**: Installation allowances, stock management, profit margins

### Contacts Schema Details:
- **Unified Contact Model**: Single table for both leads and clients with 50+ fields covering contact info, company details, project requirements
- **Polish Business Context**: NIP validation, voivodeship support, postal code format validation
- **Contact Classification**: Source tracking (website, social media, referrals), status pipeline, priority levels, lead vs client distinction
- **Project Types**: New construction, renovation, commercial projects with specific requirements
- **Qualification Scoring**: Intelligent scoring based on budget, interest level, buying power, decision authority
- **Advanced Analytics**: Conversion funnel tracking, geographic analysis, budget segmentation
- **Mock Data Service**: 5 realistic Polish business contacts for development and testing
- **Comprehensive API**: 25+ endpoints covering full contact lifecycle management

### Quotes Schema Details:
- **Quote Generation**: Smart quote creation with product and service integration
- **Service Matching**: Automatic service recommendations based on contact requirements
- **Polish Business Format**: VAT calculations, NIP integration, Polish invoice standards
- **Quote Status Pipeline**: Draft, sent, accepted, rejected, expired status management
- **PDF Generation**: Professional quote documents with company branding
- **Revision Tracking**: Quote version control and modification history

### Services Schema Details:
- **Flooring Services Catalog**: Comprehensive service definitions for Polish construction market
- **Service Categories**: Installation, consultation, measurement, maintenance, repair services
- **Pricing Models**: Fixed price, hourly rate, square meter pricing with cost calculations
- **Service Descriptions**: Detailed Polish descriptions with technical specifications

### Sample Data:
Development database comes pre-populated with realistic sample data for testing. Mock data includes 5 contacts (unified leads/clients), 5 notes, 3 users, sample quotes, and flooring services with realistic Polish business relationships.

## Authentication & Security

- **JWT-based authentication** with 24h expiration  
- **bcrypt password hashing**
- **Role-based access** (admin/user)
- **CORS configuration** for cross-origin requests
- **Redis session storage**

### JWT Configuration:
- Secret: `JWT_SECRET` environment variable
- Expiration: 24 hours
- Used across all microservices for authorization

## PDF Processing Pipeline

The PDF service uses **PaddleOCR** for text extraction:
1. Upload via API Gateway `/pdf/analyze`
2. FastAPI service processes with OCR using PyMuPDF for PDF handling
3. Returns structured data (invoice numbers, dates, amounts)
4. Supports batch processing and async operations
5. Includes image preprocessing with OpenCV and Pillow
6. Optional Celery integration for background processing with Redis

### PDF Service Dependencies:
- **FastAPI** with uvicorn server
- **PaddleOCR** for text recognition
- **PyMuPDF** for PDF processing 
- **pdf2image** for PDF to image conversion
- **OpenCV & Pillow** for image processing
- **Celery & Redis** for async processing (optional)

## Key Development Patterns

### NestJS Services Pattern:
- **Module-based architecture** with controllers, services, modules
- **DTO validation** using class-validator with whitelist and transform options
- **Dependency injection** throughout with proper module imports
- **Async/await patterns** for database operations
- **Mock data services** for development/testing
- **Global validation pipes** with transform and forbidNonWhitelisted enabled
- **Global exception filters** for consistent error handling

### Frontend Architecture:
- **React functional components** with hooks
- **Material UI** for consistent design system with icons
- **Context API** for authentication state management
- **React Router** for navigation
- **Error boundaries** for graceful error handling
- **DevTools component** for development utilities and mock data toggling
- **Dual-mode API service** with mock/real data switching

### Products Service Patterns:
- **TypeORM entities** with comprehensive validation decorators
- **Enum-based categories** for ProductCategory, BaseUnit, SellingUnit, ProductStatus
- **Complex entity relationships** with computed properties and utility methods
- **PostgreSQL UUID primary keys** with indexes on frequently queried columns
- **Polish business domain** with flooring/construction industry specifics

### Error Handling:
- **Global error boundaries** in React
- **Structured error responses** from API with HttpExceptionFilter
- **Validation errors** with detailed messages via class-validator
- **Network error handling** with retry logic
- **CORS configuration** for cross-origin requests

## Environment Configuration

### Required Environment Variables:
```bash
# Database
DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Services URLs (for API Gateway)
USERS_SERVICE_URL=http://users-service:3001
NOTES_SERVICE_URL=http://notes-service:3003
PRODUCTS_SERVICE_URL=http://products-service:3004
CONTACTS_SERVICE_URL=http://contacts-service:3005
QUOTES_SERVICE_URL=http://quotes-service:3006
SERVICES_SERVICE_URL=http://services-service:3007
PDF_SERVICE_URL=http://pdf-service:8000

# Redis
REDIS_URL=redis://redis:6379

# Frontend
REACT_APP_API_URL=http://localhost:3000

# Optional PDF Service Configuration
PYTHONPATH=/app

# Optional Development Settings
NODE_ENV=development
PORT=3000
```

### Docker Compose Port Mapping:
- API Gateway: localhost:3000 → container:3000 ✅
- Users Service: localhost:3001 → container:3001 ✅
- Notes Service: localhost:3003 → container:3003 ✅
- Products Service: localhost:3004 → container:3004 ✅
- Contacts Service: localhost:3005 → container:3005 ✅
- Quotes Service: localhost:3006 → container:3006 ⚠️ (Service runs, API Gateway connection issues)
- Services Service: localhost:3007 → container:3007 ✅
- Frontend: localhost:3333 → container:3333 ⚠️ (Port updated, currently commented out)
- PDF Service: localhost:8000 → container:8000 ⚠️ (Currently commented out)
- PostgreSQL: localhost:5432 → container:5432 ✅
- Redis: localhost:6379 → container:6379 ✅

## Common Development Workflows

### Adding a New Feature:
1. Start with mock data in frontend for rapid UI development
2. Create/update API endpoints in relevant microservice
3. Update database schema if needed (add migrations)
4. Test with mock data first, then real API integration
5. Add tests for both frontend and backend components

### Debugging Issues:
1. Check docker-compose logs for the relevant service
2. Use browser DevTools to toggle between mock/real data
3. Verify database connections and data integrity
4. Check Redis for session/cache issues

### Database Changes:
1. Update `database/init.sql` for schema changes
2. Consider data migration scripts in `scripts/` directory
3. Test with sample data first
4. Update relevant service models/DTOs

## Recent System Updates & Fixes

### ✅ **Completed Improvements (2025-08-01)**
- **Contacts Service Validation Fix**: Fixed minimal contact creation to require only firstName + lastName
  - Email and phone fields made truly optional with proper validation
  - Fixed enum value mismatches (businessType: 'b2c' vs 'B2C')
  - Updated frontend Dashboard to send correct data format
  - Implemented JWT token refresh mechanism for session management
- **Docker Development Workflow**: Fixed TypeScript compilation errors and Docker build issues
  - Cleaned up conflicting .d.ts files in src/ directory
  - Updated Dockerfile for proper production builds
  - Added hot reload development workflow documentation
- **Authentication System**: JWT-based auth fully operational with test users
- **Network Binding Issues**: Fixed `localhost` → `0.0.0.0` binding for Users and Products services
- **Frontend Search**: Optimized product search with debounced filtering and smooth UX
- **Database**: PostgreSQL operational with 3450+ products loaded
- **Docker Services**: Core backend services containerized and running
- **Contacts Service**: Complete unified microservice implementation (formerly Leads Service)
  - Full NestJS service with 25+ API endpoints and Swagger documentation
  - Advanced contact qualification scoring and conversion funnel tracking
  - Mock data service with 5 realistic Polish business contacts
  - Comprehensive test suite (unit, integration, e2e, validation tests)
  - Database schema with 50+ fields and 15+ performance indexes
  - API Gateway integration and Docker containerization

### ⚠️ **Known Issues & Missing Components**
- **Quotes Service**: Service runs but API Gateway cannot connect (503 errors)
- **Frontend Deployment**: Currently commented out, port updated to 3333 to resolve conflicts
- **Docker Health Checks**: Missing healthcheck configuration causing "unhealthy" status
- **PDF Service**: Commented out, needs integration
- **API Documentation**: Swagger integration incomplete
- **Monitoring**: No centralized logging or health monitoring
- **Testing**: Automated testing framework not yet implemented

### 🔧 **Network Binding Fix Pattern**
When adding new services, ensure proper network binding:
```javascript
// In main.ts - WRONG:
await app.listen(port, 'localhost');

// CORRECT:
await app.listen(port, '0.0.0.0');
```

### 🎯 **Test User Credentials**
- **Admin**: `a.orlowski@superparkiet.pl` / `SuperParkiet123`
- **Sales**: `p.sowinska@superparkiet.pl` / `SuperParkiet456`
- **Manager**: `g.pol@superparkiet.pl` / `SuperParkiet789`

## Implementation Workflow Integration

### 📋 **SuperClaude Framework Integration**
This project includes comprehensive implementation planning:
- **Workflow Document**: `IMPLEMENTATION_WORKFLOW.md` - Complete 5-phase implementation plan
- **SuperClaude Commands**: Integrated with `/sc:workflow`, `/sc:implement`, `/sc:analyze`
- **Auto-Activated Personas**: Backend, Frontend, DevOps, Security, QA based on task context

### 🚀 **Next Priority Tasks (from bmad analysis)**
1. **Fix Quotes Service API Gateway Connection** - Resolve 503 errors for quote generation
2. **Enable Frontend Deployment** - Uncomment and configure frontend on port 3333
3. **Add Docker Health Checks** - Implement proper healthcheck configuration
4. **Complete API Gateway Integration** - Ensure all services are properly routed
5. **Update Service Discovery** - Ensure proper inter-service communication
6. **Fix Frontend-Backend Integration** - Complete full-stack functionality

### 📈 **Development Phases**
- **Phase 1**: System Stabilization (Quotes Service connection, health checks, service discovery)
- **Phase 2**: Frontend Integration (Enable frontend on port 3333, full system integration)
- **Phase 3**: Security & Monitoring (Auth hardening, logging, observability, health monitoring)
- **Phase 4**: Testing & QA (Automated testing, API documentation, comprehensive test coverage)
- **Phase 5**: Performance & Scalability (Optimization, caching, indexing, load balancing)
- **Phase 6**: Production Readiness (CI/CD, deployment, backup/recovery, monitoring)

## Testing Strategy

- **Unit tests**: Jest for both NestJS and React components
- **Integration tests**: Test API endpoints with real database
- **E2E tests**: Test complete user workflows
- **Mock data testing**: Validate UI components independently using DevTools toggle
- **Database tests**: Verify schema and relationships
- **Python tests**: pytest for PDF service functionality

### Running Tests:
```bash
# NestJS services
cd <service-directory>
npm test
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests

# React frontend
cd frontend
npm test

# Python PDF service
cd pdf-service
pytest
```

### Mock Data Testing:
- Use browser DevTools panel to toggle between mock and real data
- Mock data includes 5 contacts (unified leads/clients), 5 notes, 3 demo users, sample quotes, and services
- Demo accounts: 
  - **Admin**: `a.orlowski@superparkiet.pl` / `SuperParkiet123`
  - **Sales**: `p.sowinska@superparkiet.pl` / `SuperParkiet456` 
  - **Manager**: `g.pol@superparkiet.pl` / `SuperParkiet789`
- Legacy demo accounts: john@example.com, jane@example.com, bob@example.com (password: password123)