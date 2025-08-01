import { Controller, Post, Body, HttpCode, HttpStatus, UseFilters, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
@UseFilters(HttpExceptionFilter)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password
    );
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async refresh(@Request() req: any) {
    // Forward refresh request to users service with original authorization header
    const authHeader = req.headers.authorization;
    return this.authService.refreshToken(authHeader);
  }
} 