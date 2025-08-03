import { Controller, Get, HttpStatus, HttpException, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, OverallHealthStatus, ServiceHealthStatus } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check for API Gateway' })
  @ApiResponse({ status: 200, description: 'API Gateway is healthy' })
  async getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('check')
  @ApiOperation({ summary: 'Comprehensive health check with downstream services' })
  @ApiResponse({ status: 200, description: 'All services are healthy' })
  @ApiResponse({ status: 503, description: 'One or more services are unhealthy' })
  async getHealthCheck(): Promise<OverallHealthStatus> {
    try {
      const healthStatus = await this.healthService.checkAllServices();
      
      const isHealthy = healthStatus.services.every(service => service.status === 'healthy');
      
      if (!isHealthy) {
        throw new HttpException(healthStatus, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return healthStatus;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          message: 'Health check failed',
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get('services')
  @ApiOperation({ summary: 'Get health status of all downstream services' })
  @ApiResponse({ status: 200, description: 'Returns health status of all services' })
  async getServicesHealth(): Promise<OverallHealthStatus> {
    return await this.healthService.checkAllServices();
  }

  @Get('services/:serviceName')
  @ApiOperation({ summary: 'Get health status of specific service' })
  @ApiResponse({ status: 200, description: 'Returns health status of specific service' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async getServiceHealth(@Param('serviceName') serviceName: string): Promise<ServiceHealthStatus> {
    const supportedServices = ['users', 'notes', 'products', 'contacts', 'quotes', 'services', 'ocr'];
    
    if (!supportedServices.includes(serviceName)) {
      throw new HttpException(
        `Service '${serviceName}' not found. Supported services: ${supportedServices.join(', ')}`,
        HttpStatus.NOT_FOUND
      );
    }

    return await this.healthService.checkServiceHealth(serviceName);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness() {
    try {
      // Check if we can connect to essential services (database, Redis)
      const readinessStatus = await this.healthService.checkReadiness();
      
      if (!readinessStatus.ready) {
        throw new HttpException(readinessStatus, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return readinessStatus;
    } catch (error) {
      throw new HttpException(
        {
          ready: false,
          timestamp: new Date().toISOString(),
          message: 'Service not ready',
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe for Kubernetes/Docker' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness() {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      service: 'api-gateway',
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }
}