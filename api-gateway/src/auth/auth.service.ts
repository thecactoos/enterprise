import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://users-service:3001';

  constructor(
    private jwtService: JwtService,
    private httpService: HttpService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.usersServiceUrl}/auth/login`, {
          email,
          password,
        })
      );
      // Return the complete response from users service (includes access_token + user)
      return (response.data as any);
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async login(user: any) {
    // User parameter now contains the complete response from users service
    return {
      access_token: user.access_token,
      user: {
        id: user.user.id,
        email: user.user.email,
        firstName: user.user.firstName,
        lastName: user.user.lastName,
        role: user.user.role,
      },
    };
  }

  async register(userData: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.usersServiceUrl}/auth/register`, {
          firstName: userData.name ? userData.name.split(' ')[0] : userData.firstName,
          lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : userData.lastName,
          email: userData.email,
          password: userData.password,
        })
      );
      return (response.data as any);
    } catch (error) {
      throw new UnauthorizedException(error.response?.data?.message || 'Registration failed');
    }
  }
} 