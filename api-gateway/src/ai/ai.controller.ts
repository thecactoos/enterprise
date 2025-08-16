import { Controller, Post, Body, Get, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AIClientService, OCRAnalysisRequest, OCRAnalysisResult } from './ai-client.service';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiClientService: AIClientService) {}

  @Post('analyze-ocr')
  @ApiOperation({ summary: 'Analyze OCR text with AI' })
  @ApiResponse({ 
    status: 200, 
    description: 'OCR text analyzed successfully',
    type: Object
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async analyzeOCR(@Body() request: OCRAnalysisRequest): Promise<OCRAnalysisResult> {
    this.logger.log(`AI OCR analysis request for file: ${request.filename}`);
    
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text is required for analysis');
    }

    try {
      const result = await this.aiClientService.analyzeOCRText(request);
      this.logger.log(`AI analysis completed for ${request.filename}`);
      return result;
    } catch (error) {
      this.logger.error('AI analysis failed', error);
      throw error;
    }
  }

  @Get('health')
  @ApiOperation({ summary: 'Check AI service health' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        openai_connected: { type: 'boolean' },
        timestamp: { type: 'string' }
      }
    }
  })
  async checkHealth() {
    return await this.aiClientService.checkAIHealth();
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available AI models'
  })
  async getModels() {
    return await this.aiClientService.getAIModels();
  }
}