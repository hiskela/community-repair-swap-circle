
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
import { UpdateProfileDto } from '../users/dto/update-profile.dto';
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
async changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
) {
  return this.usersService.changePassword(
    userId,
    currentPassword,
    newPassword,
  );
}
async updateProfile(
  userId: string,
  updateProfileDto: UpdateProfileDto,
) {
  return this.usersService.updateProfile(userId, updateProfileDto);
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
async requestEmailChange(
  userId: string,
  newEmail: string,
  password: string,
) {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await this.usersService.requestEmailChange(
    userId,
    newEmail,
    password,
    tokenHash,
    expiresAt,
  );

  await this.emailService.sendEmailChangeVerification(
    newEmail.trim().toLowerCase(),
    token,
  );

  return {
    message: 'A verification link has been sent to your new email address.',
  };
}
async confirmEmailChange(token: string) {
  if (!token || token.length > 200) {
    throw new BadRequestException('Invalid or expired email-change token');
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');

  const user = await this.usersService.findByEmailChangeTokenHash(tokenHash);

  if (!user) {
    throw new BadRequestException('Invalid or expired email-change token');
  }

  const confirmed = await this.usersService.confirmEmailChange(
    user._id.toString(),
    tokenHash,
  );

  if (!confirmed) {
    throw new ConflictException('Email change token has already been used or expired');
  }

  return { message: 'Email address changed and verified successfully.' };
}
async getProfile(userId: string) {
  return this.usersService.getProfile(userId);
}
}
