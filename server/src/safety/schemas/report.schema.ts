import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReportDocument = HydratedDocument<Report>;

export enum ReportTargetType {
  USER = 'user',
  LISTING = 'listing',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  DISMISSED = 'dismissed',
}

@Schema({ timestamps: true })
export class Report {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({ type: String, enum: ReportTargetType, required: true })
  targetType: ReportTargetType;

  @Prop({ type: Types.ObjectId, required: true })
  targetId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 10, maxlength: 1000 })
  reason: string;

  @Prop({ type: String, enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: String, maxlength: 1000 })
  adminNotes?: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);