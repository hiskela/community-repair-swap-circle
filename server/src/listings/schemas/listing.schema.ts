
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ListingDocument = HydratedDocument<Listing>;

export enum ListingType {
  NEED_REPAIR = 'need_repair',
  AVAILABLE = 'available',
  LOOKING_FOR_PARTS = 'looking_for_parts',
}

export enum ListingStatus {
  OPEN = 'open',
  RESERVED = 'reserved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Listing {
  @Prop({ required: true, trim: true, maxlength: 100 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 1000 })
  description: string;

  @Prop({ required: true, enum: ListingType })
  type: ListingType;

  @Prop({ required: true, trim: true, maxlength: 100 })
  category: string;

  @Prop({ trim: true, maxlength: 200 })
  location?: string;

  @Prop({
    type: String,
    enum: ListingStatus,
    default: ListingStatus.OPEN,
  })
  status: ListingStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}

export const ListingSchema = SchemaFactory.createForClass(Listing);
