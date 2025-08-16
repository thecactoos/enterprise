import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AIService, OCRAnalysisRequest, OCRAnalysisResult } from './ai.service';

@ApiTags('ai')
@Controller('ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiService: AIService) {}

  @Post('analyze-ocr')
  @ApiOperation({ summary: 'Analyze OCR text with AI' })
  @ApiResponse({ 
    status: 200, 
    description: 'OCR text analyzed successfully',
    type: Object
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async analyzeOCR(@Body() request: OCRAnalysisRequest): Promise<OCRAnalysisResult> {
    this.logger.log(`AI OCR analysis request for file: ${request.filename}`);
    
    if (!request.text || request.text.trim().length === 0) {
      throw new Error('Text is required for analysis');
    }

    try {
      const result = await this.aiService.analyzeOCRText(request);
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
    const isConnected = await this.aiService.testConnection();
    
    return {
      status: isConnected ? 'healthy' : 'degraded',
      openai_connected: isConnected,
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      version: '1.0.0',
      message: isConnected 
        ? 'AI services are operational' 
        : 'OpenAI connection failed - check API key configuration'
    };
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available OpenAI models' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of available models',
    schema: {
      type: 'object',
      properties: {
        models: { 
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  async getModels() {
    try {
      const models = await this.aiService.getModels();
      return {
        models: models.filter(model => model.includes('gpt')), // Show only GPT models
        total: models.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to fetch models', error);
      throw error;
    }
  }
}