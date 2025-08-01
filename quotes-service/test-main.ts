import { NestFactory } from '@nestjs/core';
import { TestAppModule } from './test-app.module';

async function bootstrap() {
  const app = await NestFactory.create(TestAppModule);
  
  const port = 3008;
  await app.listen(port);
  
  console.log(`Simple test app running on: http://localhost:${port}`);
}
bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});