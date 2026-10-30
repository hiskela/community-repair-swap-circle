
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OfferDocument = HydratedDocument<Offer>;

export enum OfferStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

@Schema({ timestamps: true })
export class Offer {
  @Prop({
    type: Types.ObjectId,
    ref: 'Listing',
    required: true,
  })
  listing: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 1000,
  })
  message: string;

  @Prop({
    type: String,
    enum: OfferStatus,
    default: OfferStatus.PENDING,
  })
  status: OfferStatus;
 @Prop({
    type: Boolean,
    default: false,
  })
  isHiddenBySender: boolean;
}

export const OfferSchema = SchemaFactory.createForClass(Offer);
