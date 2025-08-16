import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('AI-Service');
  
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // CORS configuration for microservice communication
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3100',
      'https://cactoos.digital',
      'http://enterprise-api-gateway-dev:3000',
      'http://enterprise-frontend-next-dev:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Service API')
    .setDescription('Enterprise CRM AI Service - OpenAI Integration')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('ai', 'AI operations and analysis')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // The /health endpoint is handled by HealthController, not here

  const port = configService.get('AI_SERVICE_PORT') || 3008;
  await app.listen(port);
  
  logger.log(`🤖 AI Service running on: http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
  logger.log(`💚 Health check: http://localhost:${port}/health`);
}

bootstrap();