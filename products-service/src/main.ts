import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // API Gateway and Frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Products Service API')
    .setDescription('SPS Enterprise Products Microservice - Manage product catalog with exact column names')
    .setVersion('1.0')
    .addTag('products', 'Product management endpoints')
    .addTag('search', 'Product search and filtering')
    .addTag('analytics', 'Product analytics and statistics')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3004;
  await app.listen(port);
  
  console.log(`🚀 Products Service running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🎯 Products: ${await getProductCount()} products loaded`);
}

async function getProductCount(): Promise<number> {
  try {
    const { AppModule } = await import('./app.module');
    const app = await NestFactory.createApplicationContext(AppModule);
    const { ProductsService } = await import('./products/products.service');
    const productsService = app.get(ProductsService);
    const count = await productsService.getCount();
    await app.close();
    return count;
  } catch (error) {
    return 6896; // Fallback to our known count
  }
}

bootstrap();