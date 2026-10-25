
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Messages')
@ApiBearerAuth()
@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@Req() req: Request, @Body() dto: SendMessageDto) {
    return this.messagesService.create(
      dto.transactionId,
      (req.user as any).userId,
      dto.content,
    );
  }

  @Get(':transactionId')
  findConversation(
    @Req() req: Request,
    @Param('transactionId') transactionId: string,
  ) {
    return this.messagesService.findConversation(
      transactionId,
      (req.user as any).userId,
    );
  }
}
