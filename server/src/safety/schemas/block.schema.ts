import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BlockDocument = HydratedDocument<Block>;

@Schema({ timestamps: true })
export class Block {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blocker: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blockedUser: Types.ObjectId;
}

export const BlockSchema = SchemaFactory.createForClass(Block);

BlockSchema.index({ blocker: 1, blockedUser: 1 }, { unique: true });