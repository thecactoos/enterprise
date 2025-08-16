import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [AIModule],
  controllers: [OcrController],
})
export class OcrModule {}