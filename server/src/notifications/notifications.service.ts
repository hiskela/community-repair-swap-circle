
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async findMine(userId: string) {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async markAsRead(notificationId: string, userId: string) {
    if (!isValidObjectId(notificationId)) {
      throw new NotFoundException('Notification not found');
    }

    const notification =
      await this.notificationModel.findById(notificationId);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.recipient.toString() !== userId) {
      throw new ForbiddenException(
        'You cannot update another user’s notification',
      );
    }

    notification.isRead = true;
    return notification.save();
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      {
        recipient: new Types.ObjectId(userId),
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    return {
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    };
  }

  async create(
    recipientId: string,
    type: Notification['type'],
    message: string,
    actorId?: string,
    relatedId?: string,
    relatedType?: string,
  ) {
    return this.notificationModel.create({
      recipient: new Types.ObjectId(recipientId),
      type,
      message,
      actor: actorId ? new Types.ObjectId(actorId) : undefined,
      relatedId: relatedId ? new Types.ObjectId(relatedId) : undefined,
      relatedType,
    });
  }
}
