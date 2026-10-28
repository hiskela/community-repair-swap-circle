
import {
  ConflictException,
  Injectable,
  NotFoundException,
ForbiddenException, 
BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import {
  Offer,
  OfferDocument,
  OfferStatus,
} from '../offers/schemas/offer.schema';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';
import { RespondCancellationDto } from './dto/respond-cancellation.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/schemas/notification.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from './schemas/transaction.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,

    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,
  private readonly notificationsService: NotificationsService,

  ) {}

  async createFromAcceptedOffer(offerId: string) {
    const offer = await this.offerModel.findById(offerId).exec();

    if (!offer) {
      throw new NotFoundException('Offer not found');
    }

    if (offer.status !== OfferStatus.ACCEPTED) {
      throw new ConflictException(
        'A transaction can only be created from an accepted offer',
      );
    }

    const existingTransaction = await this.transactionModel
      .findOne({ offer: offer._id })
      .exec();

    if (existingTransaction) {
      return existingTransaction;
    }

    const listing = await this.offerModel.db
      .model('Listing')
      .findById(offer.listing)
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return this.transactionModel.create({
      offer: offer._id,
      listing: offer.listing,
      requester: offer.sender,
      provider: listing.owner,
      status: TransactionStatus.AGREED,
history: [
  {
    status: TransactionStatus.AGREED,
    changedBy: offer.sender,
    note: 'Transaction created after offer acceptance',
  },
],
    });
  }
async findMyTransactions(userId: string) {
  const userObjectId = new Types.ObjectId(userId);

  return this.transactionModel
    .find({
      $or: [
        { requester: userObjectId },
        { provider: userObjectId },
        { requester: userId },
        { provider: userId },
      ],
    })
    .populate('listing', 'title type category location status')
    .populate('requester', 'name email')
    .populate('provider', 'name email')
    .sort({ createdAt: -1 })
    .exec();
}

async updateStatus(
  transactionId: string,
  userId: string,
  dto: UpdateTransactionStatusDto,
) {
  if (!isValidObjectId(transactionId)) {
    throw new BadRequestException('Invalid transaction ID');
  }

  if (
    dto.status !== TransactionStatus.IN_PROGRESS &&
    dto.status !== TransactionStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'You can only change the status to in_progress or cancelled',
    );
  }

  const transaction = await this.transactionModel
    .findById(transactionId)
    .exec();

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  const isParticipant =
    transaction.requester.toString() === userId ||
    transaction.provider.toString() === userId;

  if (!isParticipant) {
    throw new ForbiddenException(
      'Only transaction participants can update this transaction',
    );
  }

  if (transaction.status !== TransactionStatus.AGREED) {
    throw new ConflictException(
      'Only agreed transactions can be started or cancelled',
    );
  }

  transaction.status = dto.status;

  transaction.history.push({
    status: transaction.status,
    changedBy: new Types.ObjectId(userId),
    note:
      transaction.status === TransactionStatus.IN_PROGRESS
        ? 'Transaction started'
        : 'Transaction cancelled',
  });

  await transaction.save();

const otherParticipantId =
  transaction.requester.toString() === userId
    ? transaction.provider.toString()
    : transaction.requester.toString();

await this.notificationsService.create(
  otherParticipantId,
  NotificationType.TRANSACTION_UPDATED,
  transaction.status === TransactionStatus.IN_PROGRESS
    ? 'Your transaction has started.'
    : 'Your transaction has been cancelled.',
  userId,
  transaction._id.toString(),
  'transaction',
);

return transaction;
}
async requestCancellation(
  transactionId: string,
  userId: string,
  dto: RequestCancellationDto,
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
      'Only transaction participants can request cancellation',
    );
  }

  if (transaction.status !== TransactionStatus.IN_PROGRESS) {
    throw new ConflictException(
      'Only in-progress transactions can request cancellation',
    );
  }

  if (transaction.cancellationRequest?.status === 'pending') {
    throw new ConflictException(
      'A cancellation request is already pending',
    );
  }

  const otherParticipantId = isRequester
    ? transaction.provider.toString()
    : transaction.requester.toString();

  const reason = dto.reason.trim();

  transaction.cancellationRequest = {
    reason,
    requestedBy: new Types.ObjectId(userId),
    status: 'pending',
  };

  transaction.history ??= [];

  transaction.history.push({
    status: transaction.status,
    changedBy: new Types.ObjectId(userId),
    note: `Cancellation requested: ${reason}`,
  });

  await transaction.save();

  await this.notificationsService.create(
    otherParticipantId,
    NotificationType.TRANSACTION_UPDATED,
    'The other participant requested cancellation of your transaction.',
    userId,
    transaction._id.toString(),
    'transaction',
  );

  return transaction;
}

async respondToCancellation(
  transactionId: string,
  userId: string,
  dto: RespondCancellationDto,
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
      'Only transaction participants can respond to cancellation',
    );
  }

  const cancellation = transaction.cancellationRequest;

  if (!cancellation || cancellation.status !== 'pending') {
    throw new ConflictException(
      'There is no pending cancellation request',
    );
  }

  if (cancellation.requestedBy.toString() === userId) {
    throw new ForbiddenException(
      'You cannot respond to your own cancellation request',
    );
  }

  if (transaction.status !== TransactionStatus.IN_PROGRESS) {
    throw new ConflictException(
      'Only in-progress transactions can respond to cancellation',
    );
  }

  cancellation.status = dto.status;
  cancellation.respondedBy = new Types.ObjectId(userId);
  cancellation.respondedAt = new Date();

  if (dto.status === 'accepted') {
    transaction.status = TransactionStatus.CANCELLED;
    transaction.requesterConfirmedCompletion = false;
    transaction.providerConfirmedCompletion = false;
  }

  transaction.history ??= [];

  transaction.history.push({
    status: transaction.status,
    changedBy: new Types.ObjectId(userId),
    note:
      dto.status === 'accepted'
        ? 'Cancellation request accepted'
        : 'Cancellation request rejected',
  });

  await transaction.save();

  const requesterId = cancellation.requestedBy.toString();

  await this.notificationsService.create(
    requesterId,
    NotificationType.TRANSACTION_UPDATED,
    dto.status === 'accepted'
      ? 'Your cancellation request was accepted. The transaction is cancelled.'
      : 'Your cancellation request was rejected. The transaction remains active.',
    userId,
    transaction._id.toString(),
    'transaction',
  );

  return transaction;
}
async confirmCompletion(transactionId: string, userId: string) {
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
      'Only transaction participants can confirm completion',
    );
  }

  if (transaction.status !== TransactionStatus.IN_PROGRESS) {
    throw new ConflictException(
      'Only in-progress transactions can be completed',
    );
  }

  if (isRequester) {
    transaction.requesterConfirmedCompletion = true;
  }

  if (isProvider) {
    transaction.providerConfirmedCompletion = true;
  }

  if (
    transaction.requesterConfirmedCompletion &&
    transaction.providerConfirmedCompletion
  ) {
    transaction.status = TransactionStatus.COMPLETED;
  }

  transaction.history ??= [];

  transaction.history.push({
    status: transaction.status,
    changedBy: new Types.ObjectId(userId),
    note:
      transaction.status === TransactionStatus.COMPLETED
        ? 'Both participants confirmed completion'
        : 'Participant confirmed completion',
  });

 await transaction.save();

const otherParticipantId =
  transaction.requester.toString() === userId
    ? transaction.provider.toString()
    : transaction.requester.toString();

await this.notificationsService.create(
  otherParticipantId,
  NotificationType.TRANSACTION_UPDATED,
  transaction.status === TransactionStatus.COMPLETED
    ? 'Your transaction has been completed by mutual confirmation.'
    : 'The other participant confirmed transaction completion.',
  userId,
  transaction._id.toString(),
  'transaction',
);

return transaction;
}
async openDispute(
  transactionId: string,
  userId: string,
  dto: OpenDisputeDto,
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

  const isParticipant =
    transaction.requester.toString() === userId ||
    transaction.provider.toString() === userId;

  if (!isParticipant) {
    throw new ForbiddenException(
      'Only transaction participants can open a dispute',
    );
  }

  if (
    transaction.status === TransactionStatus.COMPLETED ||
    transaction.status === TransactionStatus.CANCELLED ||
    transaction.status === TransactionStatus.DISPUTED
  ) {
    throw new ConflictException(
      'A dispute cannot be opened for this transaction',
    );
  }

  transaction.status = TransactionStatus.DISPUTED;
  transaction.disputeReason = dto.reason.trim();
  transaction.disputeOpenedBy = new Types.ObjectId(userId);

  transaction.history ??= [];

  transaction.history.push({
    status: TransactionStatus.DISPUTED,
    changedBy: new Types.ObjectId(userId),
    note: `Dispute opened: ${dto.reason.trim()}`,
  });

 await transaction.save();

const otherParticipantId =
  transaction.requester.toString() === userId
    ? transaction.provider.toString()
    : transaction.requester.toString();

await this.notificationsService.create(
  otherParticipantId,
  NotificationType.DISPUTE_OPENED,
  'A dispute has been opened for your transaction.',
  userId,
  transaction._id.toString(),
  'transaction',
);

return transaction;
}
async resolveDispute(
  transactionId: string,
  adminId: string,
  dto: ResolveDisputeDto,
) {
  if (!isValidObjectId(transactionId)) {
    throw new BadRequestException('Invalid transaction ID');
  }

  if (
    dto.status !== TransactionStatus.IN_PROGRESS &&
    dto.status !== TransactionStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'A dispute can only be resolved to in_progress or cancelled',
    );
  }

  const transaction = await this.transactionModel
    .findById(transactionId)
    .exec();

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  if (transaction.status !== TransactionStatus.DISPUTED) {
    throw new ConflictException(
      'Only disputed transactions can be resolved',
    );
  }

  transaction.status = dto.status;
  transaction.resolutionNotes = dto.resolutionNotes.trim();

  if (dto.status === TransactionStatus.IN_PROGRESS) {
    transaction.requesterConfirmedCompletion = false;
    transaction.providerConfirmedCompletion = false;
  }

  transaction.history ??= [];

  transaction.history.push({
    status: dto.status,
    changedBy: new Types.ObjectId(adminId),
    note: `Dispute resolved: ${dto.resolutionNotes.trim()}`,
  });

 await transaction.save();

for (const participantId of [
  transaction.requester.toString(),
  transaction.provider.toString(),
]) {
  await this.notificationsService.create(
    participantId,
    NotificationType.DISPUTE_RESOLVED,
    `Your transaction dispute was resolved. Status: ${transaction.status}.`,
    adminId,
    transaction._id.toString(),
    'transaction',
  );
}

return transaction;
}
async findOne(transactionId: string, userId: string) {
  if (!isValidObjectId(transactionId)) {
    throw new NotFoundException('Transaction not found');
  }

  const transaction = await this.transactionModel
    .findById(transactionId)
    .populate('listing', 'title type category location status')
    .populate('requester', 'name email')
    .populate('provider', 'name email')
    .populate('history.changedBy', 'name')
    .populate('cancellationRequest.requestedBy', 'name')
    .populate('cancellationRequest.respondedBy', 'name')
    .exec();

  if (!transaction) {
    throw new NotFoundException('Transaction not found');
  }

  const isParticipant =
    transaction.requester._id.toString() === userId ||
    transaction.provider._id.toString() === userId;

  if (!isParticipant) {
    throw new ForbiddenException(
      'Only transaction participants can view transaction details',
    );
  }

  return transaction;
}
}
