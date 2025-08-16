import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { ProductsModule } from './products/products.module';
import { ContactsModule } from './contacts/contacts.module';
import { QuotesModule } from './quotes/quotes.module';
import { ServicesModule } from './services/services.module';
import { InvoicesModule } from './invoices/invoices.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './health/health.module';
import { PolishValidationModule } from './common/polish-validation.module';
import { OcrModule } from './ocr/ocr.module';
import { AIModule } from './ai/ai.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      name: 'short',
      ttl: 1000,
      limit: 10,
    }, {
      name: 'long',
      ttl: 60000,
      limit: 100,
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    RedisModule,
    HealthModule,
    PolishValidationModule,
    AuthModule,
    UsersModule,
    NotesModule,
    ProductsModule,
    ContactsModule,
    QuotesModule,
    ServicesModule,
    InvoicesModule,
    DashboardModule,
    OcrModule,
    AIModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTransformInterceptor,
    },
  ],
})
export class AppModule {} 