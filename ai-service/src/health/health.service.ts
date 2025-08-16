import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai/ai.service';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    private aiService: AIService,
  ) {}

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ai-service',
      version: '1.0.0',
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  async getDetailedHealth() {
    const basicHealth = this.getHealth();
    
    // Check OpenAI connection
    const openaiHealthy = await this.aiService.testConnection();
    
    // Check environment variables
    const hasOpenAIKey = !!this.configService.get('OPENAI_API_KEY');
    
    return {
      ...basicHealth,
      dependencies: {
        openai: {
          status: openaiHealthy ? 'healthy' : 'degraded',
          connected: openaiHealthy,
          api_key_configured: hasOpenAIKey,
        }
      },
      environment: {
        node_version: process.version,
        ai_service_port: this.configService.get('AI_SERVICE_PORT') || 3008,
      }
    };
  }
}