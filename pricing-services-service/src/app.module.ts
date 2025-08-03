import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractorsModule } from './contractors/contractors.module';
import { PricingModule } from './pricing/pricing.module';
import { HistoryModule } from './history/history.module';
import { HealthModule } from './health/health.module';
import { Contractor } from './contractors/contractor.entity';
import { ServicePricing } from './pricing/service-pricing.entity';
import { PriceHistory } from './history/price-history.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL') || 
             `postgresql://${configService.get('DB_USER', 'crm_user')}:${configService.get('DB_PASSWORD', 'crm_password')}@${configService.get('DB_HOST', 'postgres')}:${configService.get('DB_PORT', 5432)}/${configService.get('DB_NAME', 'crm_db')}`,
        entities: [Contractor, ServicePricing, PriceHistory],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    ContractorsModule,
    PricingModule,
    HistoryModule,
    HealthModule,
  ],
})
export class AppModule {}