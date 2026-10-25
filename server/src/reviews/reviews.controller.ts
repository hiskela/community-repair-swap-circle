import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(
      (req.user as any).userId,
      dto,
    );
  }

  @Get('received')
  findReceived(@Req() req: Request) {
    return this.reviewsService.findReceived(
      (req.user as any).userId,
    );
  }

  @Get('given')
  findGiven(@Req() req: Request) {
    return this.reviewsService.findGiven(
      (req.user as any).userId,
    );
  }
}