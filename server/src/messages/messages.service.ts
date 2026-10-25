
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { Block } from '../safety/schemas/block.schema';
import {
  Transaction,
  TransactionStatus,
} from '../transactions/schemas/transaction.schema';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,

    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,

    @InjectModel(Block.name)
    private readonly blockModel: Model<Block>,
  ) {}

  private async verifyParticipant(
    transactionId: string,
    userId: string,
  ) {
    if (!isValidObjectId(transactionId)) {
      throw new BadRequestException('Invalid transaction ID');
    }

    const transaction = await this.transactionModel
      .findById(transactionId)
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const isRequester = transaction.requester.toString() === userId;
    const isProvider = transaction.provider.toString() === userId;

    if (!isRequester && !isProvider) {
      throw new ForbiddenException(
        'You are not a participant in this transaction',
      );
    }

    if (
      transaction.status === TransactionStatus.CANCELLED ||
      transaction.status === TransactionStatus.DISPUTED
    ) {
      throw new ForbiddenException(
        'Messaging is unavailable for this transaction',
      );
    }

    const otherUserId = isRequester
      ? transaction.provider.toString()
      : transaction.requester.toString();

    const blockExists = await this.blockModel.exists({
      $or: [
        {
          blocker: new Types.ObjectId(userId),
          blockedUser: new Types.ObjectId(otherUserId),
        },
        {
          blocker: new Types.ObjectId(otherUserId),
          blockedUser: new Types.ObjectId(userId),
        },
      ],
    });

    if (blockExists) {
      throw new ForbiddenException(
        'Messaging is unavailable because a block exists between participants',
      );
    }

    return transaction;
  }

  async create(
    transactionId: string,
    userId: string,
    content: string,
  ) {
    await this.verifyParticipant(transactionId, userId);

    return this.messageModel.create({
      transaction: new Types.ObjectId(transactionId),
      sender: new Types.ObjectId(userId),
      content: content.trim(),
    });
  }

  async findConversation(
    transactionId: string,
    userId: string,
  ) {
    await this.verifyParticipant(transactionId, userId);

    return this.messageModel
      .find({ transaction: new Types.ObjectId(transactionId) })
      .populate('sender', 'name')
      .sort({ createdAt: 1 })
      .exec();
  }
}
