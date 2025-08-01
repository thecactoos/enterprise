import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { NotesModule } from './notes/notes.module';
import { ProductsModule } from './products/products.module';
import { ContactsModule } from './contacts/contacts.module';
import { QuotesModule } from './quotes/quotes.module';
import { ServicesModule } from './services/services.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    RedisModule,
    AuthModule,
    UsersModule,
    NotesModule,
    ProductsModule,
    ContactsModule,
    QuotesModule,
    ServicesModule,
    DashboardModule,
  ],
})
export class AppModule {} 