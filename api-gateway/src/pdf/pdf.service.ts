import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';

@Injectable()
export class PdfService {
  private readonly pdfServiceUrl = process.env.PDF_SERVICE_URL || 'http://pdf-service:8000';

  async uploadAndProcessPdf(file: any, ocrConfig: any = null): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      if (ocrConfig) {
        formData.append('ocr_config', JSON.stringify(ocrConfig));
      }

      const response = await axios.post(
        `${this.pdfServiceUrl}/api/v1/upload-and-process`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000, // 5 minutes timeout for OCR processing
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to upload and process PDF');
    }
  }

  async uploadPdf(file: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });

      const response = await axios.post(
        `${this.pdfServiceUrl}/api/v1/upload`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to upload PDF');
    }
  }

  async processPdf(fileId: string, ocrConfig: any = null): Promise<any> {
    try {
      const data = ocrConfig ? { ocr_config: ocrConfig } : {};
      
      const response = await axios.post(
        `${this.pdfServiceUrl}/api/v1/process/${fileId}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000, // 5 minutes timeout for OCR processing
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to process PDF');
    }
  }

  async getFiles(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.pdfServiceUrl}/api/v1/files`,
        {
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to get files');
    }
  }

  async getFileInfo(fileId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.pdfServiceUrl}/api/v1/files/${fileId}`,
        {
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to get file info');
    }
  }

  async deleteFile(fileId: string): Promise<any> {
    try {
      const response = await axios.delete(
        `${this.pdfServiceUrl}/api/v1/files/${fileId}`,
        {
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to delete file');
    }
  }

  async getOcrConfig(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.pdfServiceUrl}/api/v1/ocr/config`,
        {
          timeout: 10000, // 10 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new BadRequestException(error.response.data);
      }
      throw new BadRequestException('Failed to get OCR config');
    }
  }

  // Legacy method for backward compatibility
  async analyzePdf(file: any): Promise<any> {
    return this.uploadAndProcessPdf(file, null);
  }
} 