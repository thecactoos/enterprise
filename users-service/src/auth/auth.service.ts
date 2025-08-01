import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.usersService.validatePassword(user, password)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(userData: Partial<User>) {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new UnauthorizedException('User with this email already exists');
    }
    
    const user = await this.usersService.create(userData);
    const { passwordHash, ...result } = user;
    return result;
  }

  async refreshToken(userPayload: any) {
    // Get fresh user data from database
    const user = await this.usersService.findOne(userPayload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new token with current user data
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
} 