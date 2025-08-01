import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { email: string; password: string }) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: { email: string; password: string; firstName: string; lastName: string }) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(@Request() req) {
    // Generate new token for authenticated user
    return this.authService.refreshToken(req.user);
  }
} 