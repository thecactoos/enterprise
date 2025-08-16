# Polish Construction CRM - Pricing Enhancement Project Overview

## Current System Status

### ✅ Operational Services
- **API Gateway** (Port 3000) - Main entry point, JWT auth, request routing
- **Users Service** (Port 3001) - User management and authentication
- **Notes Service** (Port 3003) - Notes linked to contacts
- **Products Service** (Port 3004) - Product catalog with 3450+ Polish flooring products
- **Contacts Service** (Port 3005) - Unified contact management (leads + clients)
- **Services Service** (Port 3007) - Flooring services catalog with pricing
- **PostgreSQL** (Port 5432) - Main database with UUID primary keys
- **Redis** (Port 6379) - Caching and session storage

### ⚠️ Current Issues
- **Quotes Service** (Port 3006) - Service runs but API Gateway connection issues (503 errors)
- **Frontend** (Port 3333) - Currently commented out, needs deployment
- **PDF Service** (Port 8000) - Commented out, needs integration
- Missing health checks causing "unhealthy" status in containers

### 🎯 Enhancement Scope

#### Core Pricing System Features
1. **Advanced Quote Generation**
   - Multi-product quote creation with service integration
   - Dynamic pricing based on quantity, project complexity, location
   - Service bundle recommendations (installation, consultation, measurement)
   - Quote versioning and approval workflows

2. **Professional Invoice Generation**  
   - Polish VAT compliance (23% standard rate, reduced rates for services)
   - NIP and REGON validation and display
   - Professional PDF generation with company branding
   - Invoice numbering system following Polish standards

3. **Pricing Intelligence**
   - Profit margin optimization recommendations
   - Competitive pricing analysis
   - Bulk discount automation
   - Service pricing calculator with labor costs

#### Polish Business Requirements
- **Tax Compliance**: VAT calculations, tax-exempt scenarios, reverse charge mechanism
- **Business Registration**: NIP (Tax ID) and REGON (Statistical ID) validation
- **Invoice Standards**: Polish invoice format requirements, mandatory fields
- **Currency**: PLN pricing with proper formatting (space as thousands separator)
- **Address Format**: Polish postal codes (XX-XXX), voivodeship integration

## Current Architecture

### Database Schema
- **contacts** - 50+ fields covering Polish business context
- **products** - Complex catalog with pricing, dimensions, categories
- **services** - Flooring services with pricing models
- **quotes** - Quote generation and management (partially implemented)
- **users** - Authentication with role-based access

### Tech Stack
- **Backend**: NestJS microservices with TypeORM
- **Frontend**: React + Material UI (needs deployment)
- **Database**: PostgreSQL with UUID primary keys
- **Authentication**: JWT-based with Redis sessions
- **PDF Processing**: Python/FastAPI with PaddleOCR (needs integration)

### Test Credentials
- **Admin**: `a.orlowski@superparkiet.pl` / `SuperParkiet123`
- **Sales**: `p.sowinska@superparkiet.pl` / `SuperParkiet456`
- **Manager**: `g.pol@superparkiet.pl` / `SuperParkiet789`

## Development Approach

This project follows a **4-phase rapid prototyping approach** focused on:
- **MVP Development** - Core functionality first
- **Polish Market Validation** - B2C/B2B specific requirements
- **Quick Iterations** - 6-day development cycles
- **User Feedback Integration** - Early validation with Polish construction market

## Success Metrics

### Technical Metrics
- Quote generation time < 30 seconds
- Invoice PDF generation < 5 seconds  
- System availability > 99.5%
- API response times < 200ms

### Business Metrics
- Quote-to-conversion rate improvement > 15%
- Administrative time reduction > 40%
- Polish tax compliance validation > 99.9%
- Customer satisfaction with quote quality > 4.5/5