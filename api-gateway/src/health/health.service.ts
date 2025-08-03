import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

interface ServiceConfig {
  name: string;
  url: string;
  healthEndpoint: string;
  timeout: number;
}

export interface ServiceHealthStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  lastChecked: string;
  url: string;
}

export interface OverallHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: ServiceHealthStatus[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    unknown: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  
  private readonly services: ServiceConfig[] = [
    {
      name: 'users',
      url: process.env.USERS_SERVICE_URL || 'http://users-service:3001',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'notes',
      url: process.env.NOTES_SERVICE_URL || 'http://notes-service:3003',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'products',
      url: process.env.PRODUCTS_SERVICE_URL || 'http://products-service:3004',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'contacts',
      url: process.env.CONTACTS_SERVICE_URL || 'http://contacts-service:3005',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'quotes',
      url: process.env.QUOTES_SERVICE_URL || 'http://quotes-service:3006',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'services',
      url: process.env.SERVICES_SERVICE_URL || 'http://services-service:3007',
      healthEndpoint: '/health',
      timeout: 5000,
    },
    {
      name: 'ocr',
      url: process.env.OCR_SERVICE_URL || 'http://ocr-service:8000',
      healthEndpoint: '/health',
      timeout: 5000,
    },
  ];

  constructor(private readonly httpService: HttpService) {}

  async checkServiceHealth(serviceName: string): Promise<ServiceHealthStatus> {
    const serviceConfig = this.services.find(s => s.name === serviceName);
    if (!serviceConfig) {
      return {
        name: serviceName,
        status: 'unknown',
        error: 'Service configuration not found',
        lastChecked: new Date().toISOString(),
        url: 'unknown',
      };
    }

    return this.performHealthCheck(serviceConfig);
  }

  async checkAllServices(): Promise<OverallHealthStatus> {
    const startTime = Date.now();
    this.logger.log('Starting health check for all services');

    const healthPromises = this.services.map(service => 
      this.performHealthCheck(service)
    );

    const results = await Promise.all(healthPromises);
    
    const summary = {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      unhealthy: results.filter(r => r.status === 'unhealthy').length,
      unknown: results.filter(r => r.status === 'unknown').length,
    };

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = summary.healthy > 0 ? 'degraded' : 'unhealthy';
    }

    const endTime = Date.now();
    this.logger.log(`Health check completed in ${endTime - startTime}ms. Status: ${overallStatus}`);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: results,
      summary,
    };
  }

  async checkReadiness(): Promise<{ ready: boolean; timestamp: string; checks: any[] }> {
    const checks = [];
    let ready = true;

    // Check Redis connection (if available)
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        // For now, just check if Redis URL is configured
        checks.push({
          name: 'redis',
          status: 'configured',
          url: redisUrl,
        });
      }
    } catch (error) {
      ready = false;
      checks.push({
        name: 'redis',
        status: 'failed',
        error: error.message,
      });
    }

    // Check critical services (users service for auth)
    try {
      const usersHealth = await this.checkServiceHealth('users');
      checks.push({
        name: 'users-service',
        status: usersHealth.status,
        essential: true,
      });
      
      if (usersHealth.status !== 'healthy') {
        ready = false;
      }
    } catch (error) {
      ready = false;
      checks.push({
        name: 'users-service',
        status: 'failed',
        error: error.message,
        essential: true,
      });
    }

    return {
      ready,
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async performHealthCheck(serviceConfig: ServiceConfig): Promise<ServiceHealthStatus> {
    const startTime = Date.now();
    const healthUrl = `${serviceConfig.url}${serviceConfig.healthEndpoint}`;

    try {
      this.logger.debug(`Checking health of ${serviceConfig.name} at ${healthUrl}`);

      const response = await firstValueFrom(
        this.httpService.get(healthUrl).pipe(
          timeout(serviceConfig.timeout),
          catchError(error => {
            this.logger.warn(`Health check failed for ${serviceConfig.name}: ${error.message}`);
            return of({ 
              data: null, 
              status: 0, 
              error: error.message 
            });
          })
        )
      );

      const responseTime = Date.now() - startTime;

      if (response.status === 200) {
        this.logger.debug(`${serviceConfig.name} health check passed (${responseTime}ms)`);
        return {
          name: serviceConfig.name,
          status: 'healthy',
          responseTime,
          lastChecked: new Date().toISOString(),
          url: serviceConfig.url,
        };
      } else {
        this.logger.warn(`${serviceConfig.name} health check failed with status ${response.status}`);
        return {
          name: serviceConfig.name,
          status: 'unhealthy',
          responseTime,
          error: `HTTP ${response.status}`,
          lastChecked: new Date().toISOString(),
          url: serviceConfig.url,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.logger.error(`${serviceConfig.name} health check error: ${error.message}`);
      
      return {
        name: serviceConfig.name,
        status: 'unhealthy',
        responseTime,
        error: error.message,
        lastChecked: new Date().toISOString(),
        url: serviceConfig.url,
      };
    }
  }
}