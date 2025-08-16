import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { AIClientService } from './ai-client.service';
import { AIController } from './ai.controller';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  providers: [AIClientService],
  controllers: [AIController],
  exports: [AIClientService],
})
export class AIModule {}