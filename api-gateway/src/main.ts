import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
    preflightContinue: false,
    optionsSuccessStatus: 200
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port); // Default binding should work for Docker
  console.log(`API Gateway running on port ${port}`);
}
bootstrap(); 