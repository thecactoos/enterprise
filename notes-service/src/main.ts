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

  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Notes Service hoy reload running on port ${port}`);
}
bootstrap(); 