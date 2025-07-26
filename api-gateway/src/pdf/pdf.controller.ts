import { Controller, Post, Get, Delete, UseInterceptors, UploadedFile, UseGuards, Param, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfService } from './pdf.service';

@Controller('pdf')
@UseGuards(JwtAuthGuard)
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @Post('upload-and-process')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAndProcessPdf(@UploadedFile() file: any, @Body() body: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Extract OCR config from body if provided
    let ocrConfig = null;
    if (body.ocr_config) {
      try {
        ocrConfig = JSON.parse(body.ocr_config);
      } catch (e) {
        console.warn('Invalid OCR config JSON:', body.ocr_config);
      }
    }

    return this.pdfService.uploadAndProcessPdf(file, ocrConfig);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    return this.pdfService.uploadPdf(file);
  }

  @Post('process/:fileId')
  async processPdf(@Param('fileId') fileId: string, @Body() body: any) {
    const ocrConfig = body.ocr_config || null;
    return this.pdfService.processPdf(fileId, ocrConfig);
  }

  @Get('files')
  async getFiles() {
    return this.pdfService.getFiles();
  }

  @Get('files/:fileId')
  async getFileInfo(@Param('fileId') fileId: string) {
    return this.pdfService.getFileInfo(fileId);
  }

  @Delete('files/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    return this.pdfService.deleteFile(fileId);
  }

  @Get('ocr/config')
  async getOcrConfig() {
    return this.pdfService.getOcrConfig();
  }

  // Legacy endpoint for backward compatibility
  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  async analyzePdf(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    return this.pdfService.uploadAndProcessPdf(file, null);
  }
} 