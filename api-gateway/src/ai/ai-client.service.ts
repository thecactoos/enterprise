import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface OCRAnalysisRequest {
  text: string;
  filename?: string;
  documentType?: string;
  language?: string;
}

export interface OCRAnalysisResult {
  summary: string;
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'email' | 'phone' | 'other';
    confidence: number;
  }>;
  keyInformation: Record<string, any>;
  documentType: string;
  language: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  topics?: string[];
  actionItems?: string[];
}

@Injectable()
export class AIClientService {
  private readonly logger = new Logger(AIClientService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const aiServiceHost = this.configService.get('AI_SERVICE_HOST') || 'enterprise-ai-service-dev';
    const aiServicePort = this.configService.get('AI_SERVICE_PORT') || 3008;
    this.aiServiceUrl = `http://${aiServiceHost}:${aiServicePort}`;
    
    this.logger.log(`AI Service Client initialized for: ${this.aiServiceUrl}`);
  }

  async analyzeOCRText(request: OCRAnalysisRequest): Promise<OCRAnalysisResult> {
    try {
      this.logger.log(`Forwarding OCR analysis request for file: ${request.filename}`);

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/analyze-ocr`, request, {
          timeout: 30000, // 30 seconds timeout
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      this.logger.log(`AI service response received for ${request.filename}`);
      return response.data;

    } catch (error) {
      this.logger.error('Error communicating with AI service', error);
      
      if (error.response) {
        // AI service returned an error
        throw new HttpException(
          `AI service error: ${error.response.data?.message || error.response.statusText}`,
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      } else if (error.code === 'ECONNREFUSED') {
        // AI service is not available
        throw new HttpException(
          'AI service is currently unavailable',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      } else {
        // Other errors (timeout, etc.)
        throw new HttpException(
          `Failed to communicate with AI service: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  async checkAIHealth(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/ai/health`, {
          timeout: 5000, // 5 seconds timeout for health check
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('AI service health check failed', error);
      return {
        status: 'unavailable',
        openai_connected: false,
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  async getAIModels(): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/ai/models`, {
          timeout: 10000, // 10 seconds timeout
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch AI models', error);
      throw new HttpException(
        'Failed to fetch AI models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}