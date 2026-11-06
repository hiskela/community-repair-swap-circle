import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { APP_INTERCEPTOR } from '@nestjs/core';

import {
  ActivityLog,
  ActivityLogSchema,
} from './schemas/activity-log.schema';

import { ActivityLogsService } from './activity-logs.service';
import { ActivityLogsInterceptor } from './activity-logs.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ActivityLog.name,
        schema: ActivityLogSchema,
      },
    ]),
  ],
  providers: [
    ActivityLogsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityLogsInterceptor,
    },
  ],
  exports: [ActivityLogsService],
})
export class ActivityLogsModule {}