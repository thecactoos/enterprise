import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get('check')
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Check if the invoices service is running and healthy'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'healthy' },
        service: { type: 'string', example: 'invoices-service' },
        timestamp: { type: 'string', example: '2025-01-15T10:30:00.000Z' },
        version: { type: 'string', example: '1.0.0' },
        uptime: { type: 'number', example: 3600 },
        memory: {
          type: 'object',
          properties: {
            used: { type: 'number', example: 50331648 },
            total: { type: 'number', example: 134217728 }
          }
        }
      }
    }
  })
  getHealth() {
    const memoryUsage = process.memoryUsage();
    
    return {
      status: 'healthy',
      service: 'invoices-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal
      },
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3008
    };
  }

  @Get('readiness')
  @ApiOperation({ 
    summary: 'Readiness check',
    description: 'Check if the service is ready to handle requests'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is ready'
  })
  getReadiness() {
    return {
      status: 'ready',
      service: 'invoices-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected', // TODO: Add actual database check
        externalServices: 'available' // TODO: Add external service checks
      }
    };
  }

  @Get('liveness')
  @ApiOperation({ 
    summary: 'Liveness check',
    description: 'Check if the service is alive'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is alive'
  })
  getLiveness() {
    return {
      status: 'alive',
      service: 'invoices-service',
      timestamp: new Date().toISOString()
    };
  }
}