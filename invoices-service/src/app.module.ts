import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesModule } from './invoices/invoices.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'crm_user',
      password: process.env.DB_PASSWORD || 'crm_password',
      database: process.env.DB_NAME || 'crm_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false, // Use migrations in production
      logging: process.env.NODE_ENV === 'development',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    InvoicesModule,
    HealthModule,
  ],
})
export class AppModule {}