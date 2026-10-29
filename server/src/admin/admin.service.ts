
import { Injectable, BadRequestException,ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model,Types} from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Listing, ListingStatus } from '../listings/schemas/listing.schema';
import {
  Transaction,
  TransactionStatus,
} from '../transactions/schemas/transaction.schema';
import {
  Report,
  ReportStatus,
} from '../safety/schemas/report.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Listing.name) private readonly listingModel: Model<Listing>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Report.name) private readonly reportModel: Model<Report>,
  ) {}

  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalListings,
      openListings,
      hiddenListings,
      totalTransactions,
      inProgressTransactions,
      completedTransactions,
      disputedTransactions,
      totalReports,
      pendingReports,
      reviewedReports,
      dismissedReports,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isActive: true }).exec(),
      this.userModel.countDocuments({ isActive: false }).exec(),
      this.listingModel.countDocuments().exec(),
      this.listingModel.countDocuments({ status: ListingStatus.OPEN }).exec(),
      this.listingModel.countDocuments({ status: ListingStatus.HIDDEN }).exec(),
      this.transactionModel.countDocuments().exec(),
      this.transactionModel
        .countDocuments({ status: TransactionStatus.IN_PROGRESS })
        .exec(),
      this.transactionModel
        .countDocuments({ status: TransactionStatus.COMPLETED })
        .exec(),
      this.transactionModel
        .countDocuments({ status: TransactionStatus.DISPUTED })
        .exec(),
      this.reportModel.countDocuments().exec(),
      this.reportModel
        .countDocuments({ status: ReportStatus.PENDING })
        .exec(),
      this.reportModel
        .countDocuments({ status: ReportStatus.REVIEWED })
        .exec(),
      this.reportModel
        .countDocuments({ status: ReportStatus.DISMISSED })
        .exec(),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, inactive: inactiveUsers },
      listings: {
        total: totalListings,
        open: openListings,
        hidden: hiddenListings,
      },
      transactions: {
        total: totalTransactions,
        inProgress: inProgressTransactions,
        completed: completedTransactions,
        disputed: disputedTransactions,
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        reviewed: reviewedReports,
        dismissed: dismissedReports,
      },
    };
  }
async getDisputes() {
  return this.transactionModel
    .find({ status: TransactionStatus.DISPUTED })
    .populate('listing', 'title type category location')
    .populate('requester', 'name email')
    .populate('provider', 'name email')
    .populate('disputeOpenedBy', 'name email')
    .sort({ updatedAt: -1 })
    .exec();
}
async resolveDispute(
  transactionId: string,
  adminId: string,
  decision: TransactionStatus,
  notes: string,
) {
  if (!Types.ObjectId.isValid(transactionId)) {
    throw new BadRequestException('Invalid transaction ID');
  }

  if (!Types.ObjectId.isValid(adminId)) {
    throw new BadRequestException('Invalid administrator ID');
  }

  const allowedDecisions: TransactionStatus[] = [
    TransactionStatus.IN_PROGRESS,
    TransactionStatus.CANCELLED,
    TransactionStatus.COMPLETED,
  ];

  if (!allowedDecisions.includes(decision)) {
    throw new BadRequestException('Invalid resolution decision');
  }

  const normalizedNotes = notes.trim();

  if (normalizedNotes.length < 10 || normalizedNotes.length > 1000) {
    throw new BadRequestException(
      'Resolution notes must be between 10 and 1000 characters',
    );
  }

  const transaction = await this.transactionModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(transactionId),
      status: TransactionStatus.DISPUTED,
    },
    {
      $set: {
        status: decision,
        resolutionNotes: normalizedNotes,
      },
      $push: {
        history: {
          status: decision,
          changedBy: new Types.ObjectId(adminId),
          note: `Admin resolved dispute: ${normalizedNotes}`,
          changedAt: new Date(),
        },
      },
    },
    { new: true, runValidators: true },
  ).exec();

  if (transaction) {
    return transaction;
  }

  const exists = await this.transactionModel.exists({
    _id: new Types.ObjectId(transactionId),
  });

  if (!exists) {
    throw new NotFoundException('Transaction not found');
  }

  throw new ConflictException(
    'This transaction is not currently disputed or has already been resolved',
  );
}
}
