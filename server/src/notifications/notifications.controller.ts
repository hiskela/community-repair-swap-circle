
import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get()
  findMine(@Req() req: Request & { user: { userId: string } }) {
    return this.notificationsService.findMine(req.user.userId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch('read-all')
  markAllAsRead(
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }
}
