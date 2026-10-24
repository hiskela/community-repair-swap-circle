
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

import { createHash, randomBytes } from 'crypto';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
private readonly emailService:EmailService
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailForLogin(
      loginDto.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
async requestEmailVerification(userId: string, email: string) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await this.usersService.saveEmailVerification(
    userId,
    tokenHash,
    expiresAt,
  );

  await this.emailService.sendVerificationEmail(email, token);

  return {
    message: 'If verification is available, an email will be sent.',
  };
}

async verifyEmail(token: string) {
  if (!token || token.length > 200) {
    throw new BadRequestException('Invalid or expired verification token');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const user = await this.usersService.findByVerificationTokenHash(tokenHash);

  if (!user) {
    throw new BadRequestException('Invalid or expired verification token');
  }

  const result = await this.usersService.markEmailVerified(
    user._id.toString(),
  );

  if (result.modifiedCount !== 1) {
    throw new ConflictException('Verification token has already been used');
  }

  return { message: 'Email verified successfully' };
}
}
