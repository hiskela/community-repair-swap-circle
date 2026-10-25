import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Block } from './schemas/block.schema';
import {
  Report,
  ReportStatus,
  ReportTargetType,
} from './schemas/report.schema';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class SafetyService {
  constructor(
    @InjectModel(Block.name) private readonly blockModel: Model<Block>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async blockUser(userId: string, dto: BlockUserDto) {
    if (!isValidObjectId(dto.blockedUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    if (userId === dto.blockedUserId) {
      throw new BadRequestException('You cannot block yourself');
    }

    const user = await this.userModel.findById(dto.blockedUserId).exec();

    if (!user || !user.isActive) {
      throw new NotFoundException('Active user not found');
    }

    const existing = await this.blockModel
      .findOne({
        blocker: new Types.ObjectId(userId),
        blockedUser: new Types.ObjectId(dto.blockedUserId),
      })
      .exec();

    if (existing) {
      throw new ConflictException('You have already blocked this user');
    }

    return this.blockModel.create({
      blocker: new Types.ObjectId(userId),
      blockedUser: new Types.ObjectId(dto.blockedUserId),
    });
  }

  async unblockUser(userId: string, blockedUserId: string) {
    if (!isValidObjectId(blockedUserId)) {
      throw new BadRequestException('Invalid user ID');
    }

    const result = await this.blockModel
      .findOneAndDelete({
        blocker: new Types.ObjectId(userId),
        blockedUser: new Types.ObjectId(blockedUserId),
      })
      .exec();

    if (!result) {
      throw new NotFoundException('Block record not found');
    }

    return { message: 'User unblocked successfully' };
  }

  async findBlockedUsers(userId: string) {
    return this.blockModel
      .find({ blocker: new Types.ObjectId(userId) })
      .populate('blockedUser', 'name location')
      .sort({ createdAt: -1 })
      .exec();
  }

  async createReport(userId: string, dto: CreateReportDto) {
    if (!isValidObjectId(dto.targetId)) {
      throw new BadRequestException('Invalid target ID');
    }

    if (dto.targetType === ReportTargetType.USER) {
      if (userId === dto.targetId) {
        throw new BadRequestException('You cannot report yourself');
      }

      const targetUser = await this.userModel
        .findById(dto.targetId)
        .select('_id')
        .exec();

      if (!targetUser) {
        throw new NotFoundException('Reported user not found');
      }
    }

    return this.reportModel.create({
      reporter: new Types.ObjectId(userId),
      targetType: dto.targetType,
      targetId: new Types.ObjectId(dto.targetId),
      reason: dto.reason,
    });
  }

  async findMyReports(userId: string) {
    return this.reportModel
      .find({ reporter: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}