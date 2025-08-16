import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  Headers,
  HttpException,
  HttpStatus,
  StreamableFile,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as FormData from 'form-data';
import fetch from 'node-fetch';
import { AIClientService } from '../ai/ai-client.service';

@ApiTags('ocr')
@Controller('ocr')
export class OcrController {
  private readonly ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://enterprise-ocr-service-dev:8000';

  constructor(private readonly aiClientService: AIClientService) {}

  @Get('health')
  @ApiOperation({ summary: 'OCR service health check' })
  async healthCheck() {
    try {
      const response = await fetch(`${this.ocrServiceUrl}/health`);
      if (response.ok) {
        return { status: 'healthy', service: 'ocr' };
      } else {
        throw new HttpException('OCR service unhealthy', HttpStatus.SERVICE_UNAVAILABLE);
      }
    } catch (error) {
      throw new HttpException('OCR service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  @Post()
  @ApiOperation({
    summary: 'Process PDF or image with OCR',
    description: 'Upload PDF or JPG/PNG file for OCR processing. Requires JWT token.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'OCR processing completed successfully',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'uploads/ocr_1234.pdf' },
        text: { type: 'string', example: 'Combined text from all pages' },
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              text: { type: 'string' }
            }
          }
        },
        lines: { type: 'array', items: { type: 'string' } },
        uploaded_by_user_id: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or missing file' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 500, description: 'OCR processing error' })
  @UseInterceptors(FileInterceptor('file'))
  async processOcr(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
      }

      // Validate authorization header
      if (!authorization) {
        throw new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED);
      }

      // Create FormData for forwarding
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Forward request to OCR service
      const response = await fetch(`${this.ocrServiceUrl}/ocr`, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      // Handle response
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'OCR service error';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new HttpException(
          errorMessage,
          response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const result = await response.json();
      
      // Forward response 1:1
      res.status(response.status).json(result);
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('OCR Gateway Error:', error);
      throw new HttpException(
        'Internal server error during OCR processing',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('intelligent')
  @ApiOperation({
    summary: 'Process PDF or image with Intelligent OCR + AI Analysis',
    description: 'Upload PDF or JPG/PNG file for OCR processing with AI-powered analysis including entity recognition, summarization, and document understanding.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Intelligent OCR processing completed successfully',
    schema: {
      type: 'object',
      properties: {
        filename: { type: 'string', example: 'uploads/ocr_1234.pdf' },
        text: { type: 'string', example: 'Combined text from all pages' },
        pages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page: { type: 'number' },
              text: { type: 'string' },
              text_blocks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    bbox: { type: 'array', items: { type: 'number' } },
                    confidence: { type: 'number' }
                  }
                }
              }
            }
          }
        },
        lines: { type: 'array', items: { type: 'string' } },
        // AI Analysis Results
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        summary: { type: 'string' },
        language: { type: 'string' },
        document_type: { type: 'string' },
        key_information: { type: 'object' },
        uploaded_by_user_id: { type: 'string' },
        created_at: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid file type or missing file' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid or missing JWT token' })
  @ApiResponse({ status: 500, description: 'OCR or AI processing error' })
  @UseInterceptors(FileInterceptor('file'))
  async processIntelligentOcr(
    @UploadedFile() file: any,
    @Headers('authorization') authorization: string,
    @Query('intelligent_mode') intelligentMode: string,
    @Res() res: Response,
  ) {
    try {
      // Validate file
      if (!file) {
        throw new HttpException('No file provided', HttpStatus.BAD_REQUEST);
      }

      // Validate authorization header
      if (!authorization) {
        throw new HttpException('Authorization header required', HttpStatus.UNAUTHORIZED);
      }

      console.log('Processing Intelligent OCR for file:', file.originalname, 'Intelligent mode:', intelligentMode);

      // Create FormData for forwarding to OCR service
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      // Step 1: Get OCR results from OCR service
      const ocrResponse = await fetch(`${this.ocrServiceUrl}/ocr`, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      if (!ocrResponse.ok) {
        const errorText = await ocrResponse.text();
        let errorMessage = 'OCR service error';
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }

        throw new HttpException(
          errorMessage,
          ocrResponse.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      const ocrResult = await ocrResponse.json();
      console.log('OCR processing completed, text length:', ocrResult.text?.length || 0);

      // Step 2: Apply AI analysis if intelligent mode is enabled
      let finalResult = ocrResult;

      if (intelligentMode === 'true' && ocrResult.text && ocrResult.text.trim().length > 0) {
        try {
          console.log('Starting AI analysis...');
          const aiAnalysis = await this.aiClientService.analyzeOCRText({
            text: ocrResult.text,
            filename: file.originalname,
            documentType: 'unknown',
            language: 'unknown'
          });

          // Merge OCR results with AI analysis
          finalResult = {
            ...ocrResult,
            // AI enhancements
            entities: aiAnalysis.entities,
            summary: aiAnalysis.summary,
            language: aiAnalysis.language,
            document_type: aiAnalysis.documentType,
            key_information: aiAnalysis.keyInformation,
            sentiment: aiAnalysis.sentiment,
            topics: aiAnalysis.topics,
            action_items: aiAnalysis.actionItems,
            // Add AI processing flag
            ai_processed: true,
            ai_processing_timestamp: new Date().toISOString()
          };

          console.log('AI analysis completed successfully');
        } catch (aiError) {
          console.error('AI analysis failed, returning OCR-only results:', aiError);
          // If AI fails, return OCR results with error note
          finalResult = {
            ...ocrResult,
            ai_processed: false,
            ai_error: aiError.message,
            ai_processing_timestamp: new Date().toISOString()
          };
        }
      } else {
        console.log('Intelligent mode disabled or no text to analyze');
        finalResult = {
          ...ocrResult,
          ai_processed: false,
          ai_processing_timestamp: new Date().toISOString()
        };
      }

      // Return enhanced result
      res.status(200).json(finalResult);
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      console.error('Intelligent OCR Gateway Error:', error);
      throw new HttpException(
        'Internal server error during Intelligent OCR processing',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}