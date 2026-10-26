
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionDocument = HydratedDocument<Transaction>;

export enum TransactionStatus {
  AGREED = 'agreed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

@Schema({ _id: false })
export class CancellationRequest {
  @Prop({ required: true })
  reason: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  requestedBy: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  respondedBy?: Types.ObjectId;

  @Prop({ default: null })
  respondedAt?: Date;
}

export const CancellationRequestSchema =
  SchemaFactory.createForClass(CancellationRequest);

@Schema({ _id: false })
export class TransactionHistoryEntry {
  @Prop({
    type: String,
    enum: TransactionStatus,
    required: true,
  })
  status: TransactionStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedBy: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  note: string;

  @Prop({ type: Date, default: Date.now })
  changedAt?: Date;
}

export const TransactionHistoryEntrySchema =
  SchemaFactory.createForClass(TransactionHistoryEntry);

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Offer', required: true, unique: true })
  offer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Listing', required: true })
  listing: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  provider: Types.ObjectId;

  @Prop({
    type: String,
    enum: TransactionStatus,
    default: TransactionStatus.AGREED,
  })
  status: TransactionStatus;

  @Prop({ default: false })
  requesterConfirmedCompletion: boolean;

  @Prop({ default: false })
  providerConfirmedCompletion: boolean;

  @Prop({ type: String, maxlength: 1000 })
  disputeReason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  disputeOpenedBy?: Types.ObjectId;

  @Prop({ type: String, maxlength: 1000 })
  resolutionNotes?: string;
  @Prop({ type: CancellationRequestSchema, default: null })
  cancellationRequest?: CancellationRequest | null;
  @Prop({
    type: [TransactionHistoryEntrySchema],
    default: [],
  })
  history: TransactionHistoryEntry[];
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
