import { Controller, All, Req, Res, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import axios from 'axios';

@ApiTags('quotes')
@Controller('api/v1/quotes')
export class QuotesController {
  private readonly quotesServiceUrl = process.env.QUOTES_SERVICE_URL || 'http://quotes-service:3006';

  @All(['', '*'])
  @ApiOperation({ summary: 'Proxy all requests to Quotes Service - HOT RELOAD WORKING!' })
  async proxyToQuotesService(@Req() req: Request, @Res() res: Response) {
    try {
      // Direct proxy to quotes-service - path already includes full route
      const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
      const url = `${this.quotesServiceUrl}${path}`;
      
      console.log(`[API Gateway - HOT RELOAD WORKING] Proxying ${req.method} ${path} to ${url}`);
      
      const config: any = {
        method: req.method.toLowerCase() as any,
        url,
        headers: {
          ...req.headers,
          host: undefined, // Remove host header
        },
        timeout: 30000, // 30 second timeout
      };

      // Add request body for POST, PUT, PATCH requests
      if (['post', 'put', 'patch'].includes(req.method.toLowerCase())) {
        config.data = req.body;
      }

      // Add query parameters
      if (Object.keys(req.query).length > 0) {
        config.params = req.query;
      }

      const response = await axios(config);
      
      // Forward the response
      res.status(response.status).json(response.data);
    } catch (error) {
      console.error('Error proxying to quotes service:', error.message);
      
      if (error.response) {
        // Forward error response from quotes service
        res.status(error.response.status).json(error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        throw new HttpException(
          'Quotes service is unavailable',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}