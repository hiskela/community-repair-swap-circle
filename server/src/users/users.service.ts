
import {
  ConflictException,
  Injectable,
NotFoundException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.userModel
      .findOne({ email })
      .exec();

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      12,
    );

    const user = await this.userModel.create({
      name: registerDto.name.trim(),
      email,
      password: hashedPassword,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    };
  }
async findByEmailForLogin(email: string) {
  return this.userModel
    .findOne({ email: email.trim().toLowerCase() })
    .select('+password')
    .exec();
}
async saveEmailVerification(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
) {
  await this.userModel.updateOne(
    { _id: userId },
    {
      $set: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationTokenExpiresAt: expiresAt,
      },
    },
  ).exec();
}

async findByVerificationTokenHash(tokenHash: string) {
  return this.userModel
    .findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationTokenExpiresAt: { $gt: new Date() },
      isEmailVerified: false,
    })
    .select('+emailVerificationTokenHash +emailVerificationTokenExpiresAt')
    .exec();
}

async markEmailVerified(userId: string) {
  return this.userModel.updateOne(
    {
      _id: userId,
      isEmailVerified: false,
    },
    {
      $set: { isEmailVerified: true },
      $unset: {
        emailVerificationTokenHash: '',
        emailVerificationTokenExpiresAt: '',
      },
    },
  ).exec();
}

async getProfile(userId: string) {
  const user = await this.userModel
    .findById(userId)
    .select('name email role location isEmailVerified isActive createdAt updatedAt')
    .exec();

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

async updateProfile(
  userId: string,
  updateProfileDto: UpdateProfileDto,
) {
  const updates: Partial<UpdateProfileDto> = {};

  if (updateProfileDto.name !== undefined) {
    updates.name = updateProfileDto.name.trim();
  }

  if (updateProfileDto.location !== undefined) {
    updates.location = updateProfileDto.location.trim();
  }

  const user = await this.userModel
    .findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
    .select('name email role location isEmailVerified isActive createdAt updatedAt')
    .exec();

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

}
