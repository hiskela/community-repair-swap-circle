
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {

  Get,
  Req,
  UseGuards,
  Query,
  Patch,
} from '@nestjs/common';
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
async profile(@Req() request: AuthenticatedRequest) {
  

return this.authService.getProfile(request.user.userId);
}
@Patch('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
async updateProfile(
  @Req() request: AuthenticatedRequest,
  @Body() updateProfileDto: UpdateProfileDto,
) {
  return this.authService.updateProfile(
    request.user.userId,
    updateProfileDto,
  );
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
@Post('request-email-change')
@UseGuards(JwtAuthGuard)
requestEmailChange(
  @Req() request: AuthenticatedRequest,
  @Body() dto: ChangeEmailDto,
) {
  return this.authService.requestEmailChange(
    request.user.userId,
    dto.newEmail,
    dto.password,
  );
}

@Post('confirm-email-change')
confirmEmailChange(@Query('token') token: string) {
  return this.authService.confirmEmailChange(token);
}
@Post('change-password')
@HttpCode(HttpStatus.OK)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Change the authenticated user password' })
changePassword(
  @Req() request: AuthenticatedRequest,
  @Body() dto: ChangePasswordDto,
) {
  return this.authService.changePassword(
    request.user.userId,
    dto.currentPassword,
    dto.newPassword,
  );
}
}
