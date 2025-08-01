import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Contacts Service API')
    .setDescription(`
      **Enterprise CRM - Unified Contacts Management Service**
      
      Comprehensive contacts management microservice supporting both leads and clients in a unified model.
      
      ## Features
      - **Unified Contact Model** - Single entity for leads and clients with type differentiation
      - **Complete Lifecycle Management** - From lead creation to client conversion and retention
      - **Advanced Filtering & Search** - Multi-criteria search with full-text capabilities
      - **Polish Business Requirements** - NIP validation, voivodeship support, Polish phone numbers
      - **Qualification Scoring & Analytics** - Automatic scoring and conversion tracking
      - **Client Purchase Tracking** - Revenue tracking and purchase history
      - **Follow-up Management** - Automated scheduling and overdue tracking
      - **Bulk Operations** - Mass updates for efficiency
      - **Comprehensive Reporting** - Statistics, forecasting, and performance analytics
      
      ## Contact Types
      - **LEAD** - Prospective customers in various stages of the sales funnel
      - **CLIENT** - Converted customers with purchase history and ongoing relationships
      
      ## Lead Sources
      - Website inquiries, referrals, social media, advertisements
      - Cold calling, events, email campaigns, direct contact
      - Partnership channels and other custom sources
      
      ## Polish Business Context
      This service is specifically designed for the Polish market with:
      - NIP (tax number) validation and storage
      - Polish phone number format validation
      - Voivodeship (województwo) geographical organization
      - Polish postal code format support
      - Currency in PLN by default
      - Polish language status translations
      
      ## Status Workflows
      
      **Lead Workflow:**
      New → Contacted → Qualified → Proposal Sent → Negotiation → Converted/Lost/Unqualified
      
      **Client Workflow:**
      Converted → Active → VIP/Inactive → Churned
      
      ## Priority Levels
      - **Urgent** - Immediate attention required
      - **High** - Important prospects/clients
      - **Medium** - Standard priority
      - **Low** - Long-term opportunities
    `)
    .setVersion('2.0.0')
    .addTag('contacts', 'Unified contact management operations')
    .addTag('leads', 'Lead-specific operations (subset of contacts)')
    .addTag('clients', 'Client-specific operations')
    .addTag('statistics', 'Statistics and analytics')
    .addTag('bulk', 'Bulk operations')
    .addTag('follow-up', 'Follow-up management')
    .addServer('http://localhost:3005', 'Development Server')
    .addServer('http://leads-service:3005', 'Docker Container (legacy name)')
    .addServer('http://contacts-service:3005', 'Docker Container (new name)')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Contacts Service API Documentation',
    customfavIcon: '/favicon.ico',
    customCssUrl: '/swagger-ui-custom.css',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Get port from environment or default to 3005
  const port = process.env.PORT || 3005;
  
  // IMPORTANT: Bind to 0.0.0.0 for Docker compatibility
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Contacts Service is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation: http://0.0.0.0:${port}/api/docs`);
  console.log(`🏥 Health Check: http://0.0.0.0:${port}/api/v1/contacts/health/check`);
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'crm_db'}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start Contacts Service:', error);
  process.exit(1);
});