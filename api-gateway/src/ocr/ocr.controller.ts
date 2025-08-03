import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Headers,
  HttpException,
  HttpStatus,
  StreamableFile,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import * as FormData from 'form-data';
import fetch from 'node-fetch';

@ApiTags('ocr')
@Controller('api/ocr')
export class OcrController {
  private readonly ocrServiceUrl = process.env.OCR_SERVICE_URL || 'http://ocr-service:8000';

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
}