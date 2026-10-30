
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument = HydratedDocument<Notification>;

export enum NotificationType {
  OFFER_RECEIVED = 'offer_received',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_REJECTED = 'offer_rejected',
  OFFER_WITHDRAWN = 'offer_withdrawn',
  TRANSACTION_UPDATED = 'transaction_updated',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  recipient: Types.ObjectId;

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ required: true, trim: true, maxlength: 200 })
  message: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  actor?: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  relatedId?: Types.ObjectId;

  @Prop({ trim: true, maxlength: 50 })
  relatedType?: string;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);
