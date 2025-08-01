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
1. ✅ Lead management (simplified for B2C)
2. ✅ Basic authentication 
3. ✅ Product catalog (flooring/construction)
4. 🔄 Client management (needs restoration)
5. ⏳ PDF processing (future phase)
6. ⏳ Advanced analytics (future phase)

## System Architecture

This is a **microservices-based CRM system** with Polish documentation. The system consists of multiple NestJS services, a React frontend, and a Python FastAPI PDF processing service, all orchestrated via Docker Compose.

### Key Services:
- **API Gateway** (NestJS, Port 3000) - Main entry point, JWT auth, request routing ✅ **OPERATIONAL**
- **Users Service** (NestJS, Port 3001) - User management and authentication ✅ **OPERATIONAL** (Fixed network binding)
- **Clients Service** (NestJS, Port 3002) - Client/customer management ⚠️ **DISABLED** (Needs restoration)
- **Notes Service** (NestJS, Port 3003) - Notes linked to clients ✅ **OPERATIONAL**
- **Products Service** (NestJS, Port 3004) - Product management ✅ **OPERATIONAL** (Fixed network binding, 3450+ products)
- **Leads Service** (NestJS, Port 3005) - Lead management and qualification ✅ **OPERATIONAL** (New comprehensive service)
- **PDF Service** (Python/FastAPI, Port 8000) - PDF analysis with OCR ⚠️ **COMMENTED OUT**
- **Frontend** (React + Material UI, Port 3005) - User interface ⚠️ **COMMENTED OUT** (Placeholder)
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

# Rebuild and restart
docker-compose up --build
```

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

#### Other NestJS Services (users-service, clients-service, notes-service, products-service, leads-service)
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
- `clients` - Customer/client information with company details
- `notes` - Notes linked to clients and users with importance flags
- `products` - Complex product catalog with Polish business domain (flooring/construction)
- `leads` - Lead management and qualification with comprehensive Polish business context

### Products Schema Details:
- **Categories**: flooring, molding, accessory, panel, profile, other
- **Unit Management**: Support for multiple unit types (mm, m, m², piece) and conversions
- **Pricing Structure**: Retail, selling, and purchase prices with profit calculations
- **Dimensions**: Thickness, width, length in millimeters with computed display strings
- **Business Logic**: Installation allowances, stock management, profit margins

### Leads Schema Details:
- **Comprehensive Lead Tracking**: 50+ fields covering contact info, company details, project requirements
- **Polish Business Context**: NIP validation, voivodeship support, postal code format validation
- **Lead Classification**: Source tracking (website, social media, referrals), status pipeline, priority levels
- **Project Types**: New construction, renovation, commercial projects with specific requirements
- **Qualification Scoring**: Intelligent scoring based on budget, interest level, buying power, decision authority
- **Advanced Analytics**: Conversion funnel tracking, geographic analysis, budget segmentation
- **Mock Data Service**: 5 realistic Polish business leads for development and testing
- **Comprehensive API**: 25+ endpoints covering full lead lifecycle management

### Sample Data:
Development database comes pre-populated with realistic sample data for testing. Mock data includes 5 clients, 5 notes, 3 users with realistic relationships.

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
CLIENTS_SERVICE_URL=http://clients-service:3002
NOTES_SERVICE_URL=http://notes-service:3003
PRODUCTS_SERVICE_URL=http://products-service:3004
LEADS_SERVICE_URL=http://leads-service:3005
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
- Frontend: localhost:3005 → container:3005 (⚠️ Currently commented out)
- API Gateway: localhost:3000 → container:3000 ✅
- Users Service: localhost:3001 → container:3001 ✅
- Notes Service: localhost:3003 → container:3003 ✅
- Products Service: localhost:3004 → container:3004 ✅
- Leads Service: localhost:3005 → container:3005 ✅
- PDF Service: localhost:8000 → container:8000 (⚠️ Currently commented out)
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

### ✅ **Completed Improvements (2025-07-30)**
- **Authentication System**: JWT-based auth fully operational with test users
- **Network Binding Issues**: Fixed `localhost` → `0.0.0.0` binding for Users and Products services
- **Frontend Search**: Optimized product search with debounced filtering and smooth UX
- **Database**: PostgreSQL operational with 3450+ products loaded
- **Docker Services**: Core backend services containerized and running
- **Leads Service**: Complete microservice implementation with comprehensive Polish business context
  - Full NestJS service with 25+ API endpoints and Swagger documentation
  - Advanced lead qualification scoring and conversion funnel tracking
  - Mock data service with 5 realistic Polish business leads
  - Comprehensive test suite (unit, integration, e2e, validation tests)
  - Database schema with 50+ fields and 15+ performance indexes
  - API Gateway integration and Docker containerization

### ⚠️ **Known Issues & Missing Components**
- **Clients Service**: Currently disabled in docker-compose.yml, needs restoration
- **PDF Service**: Commented out, needs integration
- **Frontend Deployment**: Currently placeholder, needs production configuration
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

### 🚀 **Next Priority Tasks (from workflow)**
1. **Restore Clients Service** - Critical for client management functionality
2. **Fix Frontend Production Deployment** - Currently placeholder configuration
3. **Complete API Gateway Integration** - Add missing service routes
4. **Implement Health Checks** - Basic monitoring and observability
5. **Add Request Rate Limiting** - Basic security enhancement

### 📈 **Development Phases**
- **Phase 1**: Foundation Completion (Clients Service, Frontend deployment)
- **Phase 2**: Security & Monitoring (Auth hardening, logging, observability)
- **Phase 3**: Testing & QA (Automated testing, API documentation)
- **Phase 4**: Performance & Scalability (Optimization, caching, indexing)
- **Phase 5**: Production Readiness (CI/CD, deployment, backup/recovery)

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
- Mock data includes 5 clients, 5 notes, 3 demo users
- Demo accounts: 
  - **Admin**: `a.orlowski@superparkiet.pl` / `SuperParkiet123`
  - **Sales**: `p.sowinska@superparkiet.pl` / `SuperParkiet456` 
  - **Manager**: `g.pol@superparkiet.pl` / `SuperParkiet789`
- Legacy demo accounts: john@example.com, jane@example.com, bob@example.com (password: password123)