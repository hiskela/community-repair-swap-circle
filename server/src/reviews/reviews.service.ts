import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Transaction,
  TransactionStatus,
} from '../transactions/schemas/transaction.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { Review } from './schemas/review.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<Review>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    if (!isValidObjectId(dto.transactionId)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findById(dto.transactionId)
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException(
        'Only completed transactions can be reviewed',
      );
    }

    const isRequester = transaction.requester.toString() === userId;
    const isProvider = transaction.provider.toString() === userId;

    if (!isRequester && !isProvider) {
      throw new ForbiddenException(
        'Only transaction participants can leave a review',
      );
    }

    const reviewedUser = isRequester
      ? transaction.provider
      : transaction.requester;

    const existingReview = await this.reviewModel
      .findOne({
        transaction: new Types.ObjectId(dto.transactionId),
        reviewer: new Types.ObjectId(userId),
      })
      .exec();

    if (existingReview) {
      throw new ConflictException(
        'You have already reviewed this transaction',
      );
    }

    return this.reviewModel.create({
      transaction: new Types.ObjectId(dto.transactionId),
      reviewer: new Types.ObjectId(userId),
      reviewedUser,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  async findReceived(userId: string) {
    return this.reviewModel
      .find({ reviewedUser: new Types.ObjectId(userId) })
      .populate('reviewer', 'name')
      .populate('transaction', 'status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findGiven(userId: string) {
    return this.reviewModel
      .find({ reviewer: new Types.ObjectId(userId) })
      .populate('reviewedUser', 'name')
      .populate('transaction', 'status')
      .sort({ createdAt: -1 })
      .exec();
  }
}