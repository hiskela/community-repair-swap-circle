import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLog>;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  actorId: Types.ObjectId | null;

  @Prop({ default: 'Unknown' })
  actorRole: string;

  @Prop({ required: true })
  action: string;

  @Prop({ required: true })
  resource: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  method: string;

  @Prop()
  endpoint: string;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ActivityLogSchema =
  SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ actorId: 1, createdAt: -1 });
ActivityLogSchema.index({ action: 1, createdAt: -1 });