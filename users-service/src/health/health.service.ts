import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private configService: ConfigService,
    @InjectConnection()
    private connection: Connection,
  ) {}

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'users-service',
      version: '1.0.0',
      uptime: (Date.now() - this.startTime) / 1000,
    };
  }

  async getDetailedHealth() {
    const basicHealth = this.getHealth();
    
    // Check database connection
    let databaseHealthy = false;
    try {
      await this.connection.query('SELECT 1');
      databaseHealthy = true;
    } catch (error) {
      console.error('Database health check failed:', error);
      databaseHealthy = false;
    }
    
    // Check environment variables
    const hasJwtSecret = !!this.configService.get('JWT_SECRET');
    const hasDatabaseUrl = !!this.configService.get('DATABASE_URL');
    
    return {
      ...basicHealth,
      dependencies: {
        database: {
          status: databaseHealthy ? 'healthy' : 'degraded',
          connected: databaseHealthy,
          url_configured: hasDatabaseUrl,
        },
        authentication: {
          jwt_secret_configured: hasJwtSecret,
        }
      },
      environment: {
        node_version: process.version,
        port: this.configService.get('PORT') || 3003,
        node_env: this.configService.get('NODE_ENV'),
      }
    };
  }
}