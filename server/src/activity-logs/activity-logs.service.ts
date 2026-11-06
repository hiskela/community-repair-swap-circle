import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ActivityLog,
  ActivityLogDocument,
} from './schemas/activity-log.schema';

@Injectable()
export class ActivityLogsService {
  constructor(
    @InjectModel(ActivityLog.name)
    private readonly activityLogModel: Model<ActivityLogDocument>,
  ) {}

  async create(data: Partial<ActivityLog>) {
    return this.activityLogModel.create(data);
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    actorId?: string;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));

    const query: Record<string, unknown> = {};

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.resource) {
      query.resource = filters.resource;
    }

    if (filters.actorId && Types.ObjectId.isValid(filters.actorId)) {
      query.actorId = new Types.ObjectId(filters.actorId);
    }

    const [data, total] = await Promise.all([
      this.activityLogModel
        .find(query)
        .populate('actorId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),

      this.activityLogModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}