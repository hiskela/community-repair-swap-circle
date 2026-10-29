
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    .populate('listing', 'title type category')
    .populate('requester', 'name email')
    .populate('provider', 'name email')
    .populate('disputeOpenedBy', 'name email')
    .sort({ updatedAt: -1 })
    .lean()
    .exec();
}
}
