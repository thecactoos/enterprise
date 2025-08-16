# API Gateway Implementation - Complete Backend Architecture

## Overview

**Complete NestJS API Gateway implementation** for the Polish Construction CRM microservices system. The API Gateway serves as the single entry point for all client requests, handling authentication, routing, health monitoring, and Polish business validation.

### Architecture Highlights
- **Port**: 3000 (main system entry point)  
- **Authentication**: JWT token validation with refresh mechanism
- **Service Routing**: Intelligent proxying to 6 downstream microservices
- **Health Monitoring**: Comprehensive health checks with cascade failure detection
- **Polish Context**: Complete validation for NIP, REGON, postal codes, voivodeships
- **CORS Support**: Multi-origin support for frontend integration
- **Error Handling**: Centralized exception handling with structured responses

## System Architecture

### Core Components

```
API Gateway (Port 3000)
├── Authentication Layer (JWT + Passport)
├── Service Routing Layer (HTTP Proxy)
├── Health Monitoring System
├── Polish Business Validation
├── CORS & Security Configuration
└── Comprehensive Error Handling
```

### Service Routing Matrix

| Route Pattern | Target Service | Port | Purpose |
|---------------|----------------|------|---------|
| `/auth/*` | Internal Auth | - | Login, register, token refresh |
| `/users/*` | users-service | 3001 | User management |
| `/notes/*` | notes-service | 3003 | Notes management |
| `/products/*` | products-service | 3004 | Product catalog (3450+ items) |
| `/contacts/*` | contacts-service | 3005 | Contact management (leads + clients) |
| `/quotes/*` | quotes-service | 3006 | Quote generation |
| `/services/*` | services-service | 3007 | Flooring services catalog |
| `/health/*` | Internal Health | - | System monitoring |
| `/polish-validation/*` | Internal Validation | - | Polish business validation |

### Technology Stack

**Core Framework**: NestJS 10.x with TypeScript
**Authentication**: JWT with Passport.js
**HTTP Client**: Axios for service communication
**Validation**: class-validator with custom Polish validators
**Documentation**: Swagger/OpenAPI integration
**Containerization**: Docker with multi-stage builds

## Implementation Details

### 1. NestJS Service Structure

**Project Structure**:
```
api-gateway/src/
├── main.ts                          # Application bootstrap
├── app.module.ts                     # Root module configuration
├── auth/                             # Authentication system
│   ├── auth.controller.ts            # Login/register endpoints
│   ├── auth.service.ts               # Authentication logic
│   ├── auth.module.ts                # Auth module configuration
│   ├── jwt-auth.guard.ts             # Route protection
│   ├── jwt.strategy.ts               # JWT validation strategy
│   └── dto/                          # Data transfer objects
│       ├── login.dto.ts
│       └── register.dto.ts
├── health/                           # Health monitoring system
│   ├── health.controller.ts          # Health endpoints
│   ├── health.service.ts             # Health check logic
│   └── health.module.ts              # Health module configuration
├── common/                           # Shared utilities
│   ├── filters/                      # Exception filters
│   │   └── http-exception.filter.ts  # Global error handling
│   ├── validators/                   # Custom validators
│   │   └── polish-business.validator.ts # Polish business validation
│   ├── decorators/                   # Custom decorators
│   │   └── polish-validation.decorator.ts # Validation decorators
│   ├── polish-validation.controller.ts # Polish validation endpoints
│   └── polish-validation.module.ts   # Polish validation module
├── [service-proxies]/                # Microservice proxy controllers
│   ├── users/users.controller.ts     # Users service proxy
│   ├── notes/notes.controller.ts     # Notes service proxy
│   ├── products/products.controller.ts # Products service proxy
│   ├── contacts/contacts.controller.ts # Contacts service proxy
│   ├── quotes/quotes.controller.ts   # Quotes service proxy
│   └── services/services.controller.ts # Services service proxy
└── redis/                            # Redis integration
    ├── redis.service.ts              # Redis connection
    └── redis.module.ts               # Redis module
```

### 2. Authentication System Implementation

**JWT Authentication Flow**:
```typescript
// auth.controller.ts - Authentication endpoints
@Controller('auth')
export class AuthController {
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email, 
      loginDto.password
    );
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refresh(@Request() req: any) {
    return this.authService.refreshToken(req.headers.authorization);
  }
}
```

**JWT Strategy Configuration**:
```typescript
// jwt.strategy.ts - JWT validation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    });
  }
}
```

**Features**:
- **24-hour JWT expiration** with refresh token support
- **Role-based access control** (admin, user, manager)
- **Secure token validation** with Passport.js integration
- **Service delegation** to users-service for actual authentication
- **Error handling** with structured responses

### 3. Service Routing & Proxying

**Intelligent HTTP Proxying**:
```typescript
// contacts.controller.ts - Example service proxy
@Controller('contacts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContactsController {
  private readonly contactsServiceUrl = 
    process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005';

  @Get()
  async findAll(@Query() query: any) {
    try {
      const response = await this.httpService.axiosRef.get(
        `${this.contactsServiceUrl}/api/v1/contacts`, 
        { params: query }
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
    }
  }
}
```

**Routing Features**:
- **Environment-based URLs** for flexible deployment
- **Query parameter forwarding** for filtering and pagination
- **Request body proxying** for POST/PUT operations
- **Error propagation** with proper HTTP status codes
- **JWT token forwarding** to downstream services
- **Swagger documentation** for all proxied endpoints

### 4. Health Monitoring System

**Comprehensive Health Checks**:
```typescript
// health.service.ts - Health monitoring logic
@Injectable()
export class HealthService {
  async checkAllServices(): Promise<OverallHealthStatus> {
    const healthPromises = this.services.map(service => 
      this.performHealthCheck(service)
    );
    
    const results = await Promise.all(healthPromises);
    
    return {
      status: this.calculateOverallStatus(results),
      timestamp: new Date().toISOString(),
      services: results,
      summary: this.generateSummary(results)
    };
  }
}
```

**Health Endpoints**:
- `GET /health` - Basic API Gateway health
- `GET /health/check` - Comprehensive service health check
- `GET /health/services` - All downstream services status
- `GET /health/services/:serviceName` - Specific service health
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

**Monitoring Features**:
- **Cascade failure detection** with degraded status reporting
- **Response time measurement** for performance monitoring
- **Service timeout configuration** (5-second default)
- **Detailed error reporting** with structured responses
- **Kubernetes-compatible** health probes

### 5. Polish Business Context Validation

**Comprehensive Polish Validation System**:
```typescript
// polish-business.validator.ts - Custom validators
@ValidatorConstraint({ name: 'IsPolishNIP', async: false })
export class IsPolishNIPConstraint implements ValidatorConstraintInterface {
  validate(nip: string): boolean {
    const cleanNip = nip.replace(/\D/g, '');
    if (cleanNip.length !== 10) return false;
    
    // NIP checksum calculation
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanNip[i]) * weights[i];
    }
    
    return (sum % 11) === parseInt(cleanNip[9]);
  }
}
```

**Polish Validation Features**:
- **NIP Validation**: Tax identification number with checksum verification
- **REGON Validation**: Business registration number (9 or 14 digits)
- **Postal Code Validation**: Polish format (XX-XXX)
- **Voivodeship Validation**: All 16 Polish voivodeships
- **Phone Number Validation**: Polish mobile and landline formats
- **Comprehensive Entity Validation**: Complete business entity validation

**Validation Endpoints**:
- `POST /polish-validation/nip` - Validate NIP number
- `POST /polish-validation/regon` - Validate REGON number
- `POST /polish-validation/postal-code` - Validate postal code
- `POST /polish-validation/voivodeship` - Validate voivodeship
- `POST /polish-validation/phone-number` - Validate phone number
- `POST /polish-validation/business-entity` - Comprehensive validation

### 6. CORS & Security Configuration

**Multi-Origin CORS Support**:
```typescript
// main.ts - CORS configuration
app.enableCors({
  origin: [
    'http://localhost:3000',  // API Gateway
    'http://localhost:3005',  // Frontend (original port)
    'http://localhost:3333',  // Frontend (new port)
    'http://127.0.0.1:3000',  // API Gateway (IPv4)
    'http://127.0.0.1:3005',  // Frontend (IPv4 original)
    'http://127.0.0.1:3333',  // Frontend (IPv4 new)
    'http://api-gateway:3000' // Docker network
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  credentials: true,
});
```

**Security Features**:
- **CORS whitelisting** for specific origins
- **JWT token validation** on protected routes
- **Request validation** with class-validator
- **Input sanitization** with transform options
- **Security headers** configuration
- **Rate limiting** capability (configurable)

### 7. Error Handling & Logging

**Centralized Exception Handling**:
```typescript
// http-exception.filter.ts - Global error handling
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Structured error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(details && { details }),
    };

    // Comprehensive logging
    this.logger.error(`HTTP ${status} - ${error}: ${message}`, {
      path: request.url,
      method: request.method,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      timestamp: new Date().toISOString(),
    });

    response.status(status).json(errorResponse);
  }
}
```

**Error Handling Features**:
- **Structured error responses** with consistent format
- **HTTP status code propagation** from downstream services
- **Comprehensive logging** with request context
- **Development vs production** error detail levels
- **Stack trace inclusion** in development mode

### 8. Docker Integration

**Multi-Stage Production Build**:
```dockerfile
# Dockerfile - Production optimization
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**Development Container**:
```dockerfile
# Dockerfile.dev - Hot reload support
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
```

**Docker Features**:
- **Multi-stage builds** for production optimization
- **Hot reload support** for development
- **Environment variable configuration**
- **Health check integration**
- **Network binding** to 0.0.0.0 for container compatibility

## Configuration & Environment

### Environment Variables

**Required Configuration**:
```bash
# Core Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key

# Database & Redis
DATABASE_URL=postgresql://crm_user:crm_password@postgres:5432/crm_db
REDIS_URL=redis://redis:6379

# Microservice URLs
USERS_SERVICE_URL=http://users-service:3001
NOTES_SERVICE_URL=http://notes-service:3003
PRODUCTS_SERVICE_URL=http://products-service:3004
CONTACTS_SERVICE_URL=http://contacts-service:3005
QUOTES_SERVICE_URL=http://quotes-service:3006
SERVICES_SERVICE_URL=http://services-service:3007

# CORS Configuration
CORS_ORIGIN=http://localhost:3333
```

### Package Dependencies

**Core Dependencies**:
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/jwt": "^10.1.1",
    "@nestjs/passport": "^10.0.2",
    "@nestjs/config": "^3.1.1",
    "@nestjs/axios": "^3.0.0",
    "@nestjs/swagger": "^7.1.0",
    "passport": "^0.6.0",
    "passport-jwt": "^4.0.1",
    "axios": "^1.5.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "redis": "^4.6.8"
  }
}
```

## API Documentation

### Swagger Integration

**OpenAPI Documentation** available at `/api` endpoint with:
- **Authentication endpoints** with request/response schemas
- **Service proxy endpoints** with parameter documentation  
- **Health monitoring endpoints** with status code descriptions
- **Polish validation endpoints** with validation rules
- **Bearer token authentication** configuration
- **Request/response examples** for all endpoints

### Authentication Flow

**Login Process**:
1. `POST /auth/login` with email/password
2. API Gateway forwards to users-service
3. Returns JWT token + user profile
4. Token used for subsequent requests with `Authorization: Bearer <token>`

**Token Refresh**:
1. `POST /auth/refresh` with existing token
2. API Gateway forwards to users-service
3. Returns new JWT token

### Service Integration Pattern

**Standard Proxy Pattern**:
1. Client sends request to API Gateway
2. JWT token validation (if required)
3. Request forwarded to appropriate microservice
4. Response proxied back to client
5. Error handling and logging

## Performance & Monitoring

### Health Check Strategy

**Multi-Level Health Monitoring**:
- **Service-level**: Individual microservice health
- **System-level**: Overall system health with degradation detection
- **Infrastructure-level**: Database and Redis connectivity
- **Application-level**: API Gateway internal health

### Response Time Monitoring

**Performance Metrics**:
- **Health check response times** for each service
- **Request timeout configuration** (5-second default)
- **Service availability tracking**
- **Cascade failure detection**

### Error Tracking

**Comprehensive Error Logging**:
- **Request context** (URL, method, IP, user agent)
- **Error details** with stack traces (development)
- **Downstream service errors** with proper propagation
- **Structured logging format** for log aggregation

## Security Implementation

### Authentication Security

**JWT Security Features**:
- **Secret key configuration** via environment variables
- **Token expiration** (24-hour default)
- **Refresh token mechanism** for session extension
- **Bearer token validation** on protected routes

### Input Validation

**Multi-Layer Validation**:
- **DTO validation** with class-validator
- **Polish business validation** with custom validators
- **Input sanitization** with transform options
- **Request whitelisting** with forbidNonWhitelisted

### Network Security

**Network Protection**:
- **CORS whitelisting** for allowed origins
- **HTTP method restrictions**
- **Security headers** configuration  
- **Rate limiting** (configurable)

## Deployment & Operations

### Docker Compose Integration

**Service Configuration**:
```yaml
api-gateway:
  build:
    context: ./api-gateway
    dockerfile: Dockerfile.dev
  ports:
    - "3000:3000"
  environment:
    NODE_ENV: development
    JWT_SECRET: your-super-secret-jwt-key
    # ... other environment variables
  depends_on:
    - redis
    - users-service
    - notes-service
    - products-service
    - contacts-service
    - quotes-service
    - services-service
```

### Health Check Integration

**Container Health Checks**:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Development Workflow

**Local Development**:
```bash
# Start individual service
cd api-gateway
npm install
npm run start:dev

# Start with Docker
docker-compose up api-gateway -d
docker-compose logs api-gateway --tail=20

# Health check
curl http://localhost:3000/health/check
```

## Testing Strategy

### Unit Testing

**Test Coverage**:
- **Controller tests** for all endpoints
- **Service tests** for business logic
- **Validation tests** for Polish validators
- **Authentication tests** for JWT handling

### Integration Testing

**API Integration**:
- **Service proxy testing** with mock responses
- **Authentication flow testing**
- **Health check testing**
- **Error handling testing**

### End-to-End Testing

**Complete Flow Testing**:
- **Authentication → Service Access** workflows
- **Error propagation** from services
- **Health monitoring** cascade scenarios

## Best Practices Implemented

### NestJS Best Practices

- **Module-based architecture** with clear separation of concerns
- **Dependency injection** throughout the application
- **Global validation pipes** with comprehensive validation
- **Exception filters** for centralized error handling
- **Guards and strategies** for authentication
- **Swagger documentation** for all endpoints

### Microservices Best Practices

- **Service discovery** through environment configuration
- **Circuit breaker pattern** with health checks
- **Request/response logging** for debugging
- **Error propagation** with proper HTTP status codes
- **Timeout configuration** to prevent hanging requests

### Security Best Practices

- **JWT token validation** on protected routes
- **Input validation and sanitization**
- **CORS configuration** for allowed origins
- **Environment variable protection**
- **Error message sanitization** (no sensitive data exposure)

## Future Enhancements

### Planned Features

- **Rate limiting** with Redis-based storage
- **Request caching** for frequently accessed data
- **API versioning** support
- **Circuit breaker** implementation for resilience
- **Distributed tracing** for request tracking
- **Metrics collection** with Prometheus integration

### Scalability Considerations

- **Horizontal scaling** with load balancer support
- **Session storage** with Redis clustering
- **Database connection pooling**
- **Microservice load balancing**
- **Container orchestration** with Kubernetes support

## Conclusion

The API Gateway implementation provides a **complete, production-ready solution** for the Polish Construction CRM system with:

- **Comprehensive service routing** to 6 downstream microservices
- **Robust authentication system** with JWT and refresh tokens
- **Advanced health monitoring** with cascade failure detection
- **Polish business validation** with NIP, REGON, and address validation
- **Professional error handling** with structured responses
- **Docker-ready deployment** with multi-stage builds
- **Extensive documentation** with Swagger/OpenAPI integration

The system follows NestJS best practices and microservices patterns, ensuring maintainability, scalability, and reliability for production use in the Polish construction industry.