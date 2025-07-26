# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Architecture

This is a **microservices-based CRM system** with Polish documentation. The system consists of multiple NestJS services, a React frontend, and a Python FastAPI PDF processing service, all orchestrated via Docker Compose.

### Key Services:
- **API Gateway** (NestJS, Port 3000) - Main entry point, JWT auth, request routing
- **Users Service** (NestJS, Port 3001) - User management and authentication
- **Clients Service** (NestJS, Port 3002) - Client/customer management
- **Notes Service** (NestJS, Port 3003) - Notes linked to clients
- **Products Service** (NestJS, Port 3004) - Product management
- **PDF Service** (Python/FastAPI, Port 8000) - PDF analysis with OCR
- **Frontend** (React + Material UI, Port 3001) - User interface
- **PostgreSQL** (Port 5432) - Main database with UUID primary keys
- **Redis** (Port 6379) - Caching and session storage

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

#### Other NestJS Services (users-service, clients-service, notes-service)
```bash
cd <service-directory>
npm install
npm run start:dev
npm run build
npm run test
```

#### PDF Service (Python)
```bash
cd pdf-service
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest
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

### Sample Data:
Development database comes pre-populated with realistic sample data for testing.

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
2. FastAPI service processes with OCR
3. Returns structured data (invoice numbers, dates, amounts)
4. Supports batch processing and async operations

## Key Development Patterns

### NestJS Services Pattern:
- **Module-based architecture** with controllers, services, modules
- **DTO validation** using class-validator
- **Dependency injection** throughout
- **Async/await patterns** for database operations
- **Mock data services** for development/testing

### Frontend Architecture:
- **React functional components** with hooks
- **Material UI** for consistent design system
- **Context API** for authentication state
- **React Router** for navigation
- **Error boundaries** for graceful error handling
- **DevTools component** for development utilities

### Error Handling:
- **Global error boundaries** in React
- **Structured error responses** from API
- **Validation errors** with detailed messages
- **Network error handling** with retry logic

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
PDF_SERVICE_URL=http://pdf-service:8000

# Redis
REDIS_URL=redis://redis:6379

# Frontend
REACT_APP_API_URL=http://localhost:3000
```

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

## Testing Strategy

- **Unit tests**: Jest for both NestJS and React components
- **Integration tests**: Test API endpoints with real database
- **E2E tests**: Test complete user workflows
- **Mock data testing**: Validate UI components independently
- **Database tests**: Verify schema and relationships

Run tests per service using `npm test` in each directory.