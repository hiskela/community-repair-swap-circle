
import {
  Body,
  Controller,
Get,
Patch,
Req,
UseGuards,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';


interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}
@ApiTags('Users')
@Controller('users')

export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.usersService.register(registerDto);
  }

@Get('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get the current user profile' })
getMyProfile(@Req() request: AuthenticatedRequest) {
  return this.usersService.getProfile(request.user.userId);
}

@Patch('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update the current user profile' })
updateMyProfile(
  @Req() request: AuthenticatedRequest,
  @Body() updateProfileDto: UpdateProfileDto,
) {
  return this.usersService.updateProfile(
    request.user.userId,
    updateProfileDto,
  );
}

}
