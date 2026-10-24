
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Get, Req, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in with email and password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
@Get('profile')
@UseGuards(JwtAuthGuard)
profile(@Req() request: AuthenticatedRequest) {
  return {
    userId: request.user.userId,
    email: request.user.email,
    role: request.user.role,
  };
}
@Post('request-verification')
@UseGuards(JwtAuthGuard)
requestVerification(@Req() request: AuthenticatedRequest) {
  return this.authService.requestEmailVerification(
    request.user.userId,
    request.user.email,
  );
}

@Post('verify-email')
verifyEmail(@Query('token') token: string) {
  return this.authService.verifyEmail(token);
}
}
