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
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3333',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Pricing Services API')
    .setDescription('Microservice for managing service pricing, price history, and contractor rates in Polish Construction CRM')
    .setVersion('1.0')
    .addTag('contractors', 'Contractor management operations')
    .addTag('pricing', 'Service pricing operations')
    .addTag('price-history', 'Price history tracking operations')
    .addTag('health', 'Health check operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3009;
  
  // IMPORTANT: Use 0.0.0.0 for Docker compatibility
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 Pricing Services Service is running on: http://0.0.0.0:${port}`);
  console.log(`📚 API Documentation available at: http://0.0.0.0:${port}/api-docs`);
}

bootstrap();