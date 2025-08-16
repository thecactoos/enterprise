import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

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
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY not found. AI features will be disabled.');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.log('OpenAI client initialized successfully');
  }

  async analyzeOCRText(request: OCRAnalysisRequest): Promise<OCRAnalysisResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      this.logger.log(`Analyzing OCR text for file: ${request.filename}`);

      const prompt = this.createAnalysisPrompt(request);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert document analyzer specializing in Polish business documents. Analyze the provided text and return structured JSON data with the requested information. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const analysisText = response.choices[0]?.message?.content;
      if (!analysisText) {
        throw new Error('No response from OpenAI');
      }

      // Parse JSON response
      let analysis: OCRAnalysisResult;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        this.logger.error('Failed to parse OpenAI response as JSON', parseError);
        // Fallback: create a basic analysis
        analysis = this.createFallbackAnalysis(request.text, analysisText);
      }

      this.logger.log(`Analysis completed for ${request.filename}`);
      return analysis;

    } catch (error) {
      this.logger.error('Error analyzing OCR text', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  private createAnalysisPrompt(request: OCRAnalysisRequest): string {
    return `
Analyze the following Polish business document and provide a comprehensive analysis in JSON format.

Document Information:
- Filename: ${request.filename || 'unknown'}
- Detected Language: ${request.language || 'pl'}
- Document Type: ${request.documentType || 'unknown'}

Text to analyze:
"""
${request.text}
"""

Please provide a JSON response with the following structure:
{
  "summary": "A concise 2-3 sentence summary of the document content in Polish",
  "entities": [
    {
      "text": "entity text",
      "type": "person|organization|location|date|money|email|phone|other",
      "confidence": 0.95
    }
  ],
  "keyInformation": {
    "nip": "1234567890",
    "regon": "123456789",
    "company_name": "Nazwa Firmy",
    "address": "Adres",
    "invoice_number": "FV/2025/001",
    "total_amount": "1000.00 PLN",
    "issue_date": "2025-01-15"
  },
  "documentType": "invoice|contract|letter|report|form|other",
  "language": "pl",
  "sentiment": "positive|negative|neutral",
  "topics": ["faktura", "usługi", "płatność"],
  "actionItems": ["Sprawdź termin płatności", "Zweryfikuj dane kontrahenta"]
}

Instructions:
1. Extract all important Polish business entities (NIP, REGON, company names, addresses, amounts in PLN)
2. Identify key information relevant to Polish business documents
3. Provide a clear, concise summary in Polish
4. Determine the document type and language
5. Identify main topics and any action items in Polish
6. Assess overall sentiment if applicable
7. Return ONLY valid JSON, no additional text or formatting
8. All text fields should be in Polish when applicable
`;
  }

  private createFallbackAnalysis(text: string, aiResponse: string): OCRAnalysisResult {
    return {
      summary: aiResponse.length > 500 ? aiResponse.substring(0, 500) + '...' : aiResponse,
      entities: this.extractBasicEntities(text),
      keyInformation: {
        'text_length': text.length,
        'word_count': text.split(/\s+/).length,
        'ai_response': 'Analysis completed with fallback parsing'
      },
      documentType: 'other',
      language: 'pl',
      sentiment: 'neutral',
      topics: [],
      actionItems: []
    };
  }

  private extractBasicEntities(text: string) {
    const entities = [];
    
    // Polish NIP regex
    const nipRegex = /\b\d{3}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}\b/g;
    const nips = text.match(nipRegex) || [];
    nips.forEach(nip => {
      entities.push({
        text: nip,
        type: 'other' as const,
        confidence: 0.9
      });
    });

    // Basic email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push({
        text: email,
        type: 'email' as const,
        confidence: 0.9
      });
    });

    // Polish phone regex
    const phoneRegex = /(?:\+48\s?)?(?:\d{3}[\s-]?\d{3}[\s-]?\d{3}|\(\d{2}\)\s?\d{3}[\s-]?\d{2}[\s-]?\d{2})/g;
    const phones = text.match(phoneRegex) || [];
    phones.forEach(phone => {
      entities.push({
        text: phone,
        type: 'phone' as const,
        confidence: 0.8
      });
    });

    // Polish money amounts (PLN, zł)
    const moneyRegex = /\b\d+[,.]?\d*\s?(?:PLN|zł|EUR|USD|€|\$)\b/gi;
    const amounts = text.match(moneyRegex) || [];
    amounts.forEach(amount => {
      entities.push({
        text: amount,
        type: 'money' as const,
        confidence: 0.85
      });
    });

    return entities;
  }

  async testConnection(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      await this.openai.models.list();
      this.logger.log('OpenAI connection test successful');
      return true;
    } catch (error) {
      this.logger.error('OpenAI connection test failed', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const models = await this.openai.models.list();
      return models.data.map(model => model.id);
    } catch (error) {
      this.logger.error('Failed to fetch OpenAI models', error);
      throw error;
    }
  }
}