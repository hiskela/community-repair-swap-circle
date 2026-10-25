import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlockUserDto } from './dto/block-user.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { SafetyService } from './safety.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/schemas/user.schema';
import { ModerateReportDto } from './dto/moderate-report.dto';
@ApiTags('Safety')
@ApiBearerAuth()
@Controller('safety')
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  @Post('blocks')
  blockUser(@Req() req: Request, @Body() dto: BlockUserDto) {
    return this.safetyService.blockUser(
      (req.user as any).userId,
      dto,
    );
  }

  @Delete('blocks/:userId')
  unblockUser(@Req() req: Request, @Param('userId') userId: string) {
    return this.safetyService.unblockUser(
      (req.user as any).userId,
      userId,
    );
  }

  @Get('blocks')
  findBlockedUsers(@Req() req: Request) {
    return this.safetyService.findBlockedUsers(
      (req.user as any).userId,
    );
  }

  @Post('reports')
  createReport(@Req() req: Request, @Body() dto: CreateReportDto) {
    return this.safetyService.createReport(
      (req.user as any).userId,
      dto,
    );
  }

  @Get('reports/mine')
  findMyReports(@Req() req: Request) {
    return this.safetyService.findMyReports(
      (req.user as any).userId,
    );
  }
@Get('admin/reports')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
findAllReports() {
  return this.safetyService.findAllReports();
}

@Patch('admin/reports/:id')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
moderateReport(
  @Param('id') id: string,
  @Req() req: Request,
  @Body() dto: ModerateReportDto,
) {
  return this.safetyService.moderateReport(
    id,
    (req.user as any).userId,
    (req.user as any).role,
    dto,
  );
}
}