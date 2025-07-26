import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MockDataService } from '../common/services/mock-data.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private mockDataService: MockDataService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = this.mockDataService.validateUser(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }
    return user;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  async register(userData: any) {
    try {
      return this.mockDataService.createUser(userData);
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }
} 