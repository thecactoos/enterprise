import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'http://localhost:3000',  // API Gateway
      'http://localhost:3005',  // Frontend
      'http://127.0.0.1:3000',  // API Gateway (IPv4)
      'http://127.0.0.1:3005',  // Frontend (IPv4)
      'http://api-gateway:3000' // Docker network
    ],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0'); // Listen on all interfaces
  console.log(`Users Service running on port ${port}`);
}
bootstrap(); 