import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Invoices Service API')
    .setDescription('Polish VAT-Compliant Invoice Management API for CRM System')
    .setVersion('1.0')
    .addTag('invoices', 'Invoice management operations')
    .addTag('health', 'Service health and monitoring')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 3008;
  
  // CRITICAL: Bind to 0.0.0.0 for Docker network compatibility
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Invoices Service running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`💰 Polish VAT-compliant invoice system ready`);
  console.log(`🔗 Integration with Services (${process.env.SERVICES_SERVICE_URL || 'http://services-service:3007'})`);
  console.log(`📦 Integration with Products (${process.env.PRODUCTS_SERVICE_URL || 'http://products-service:3004'})`);
  console.log(`👥 Integration with Contacts (${process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005'})`);
}

bootstrap();