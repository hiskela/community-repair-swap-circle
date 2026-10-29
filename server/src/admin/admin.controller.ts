
import {
  Controller,
  Get,
  UseGuards,
  Body,
  Param,
  Req,
  Patch,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { TransactionStatus } from '../transactions/schemas/transaction.schema';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    _id?: string;
    sub?: string;
  };
};

@ApiTags('Administration')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Get disputed transactions for administrators' })
  async getDisputes() {
    return this.adminService.getDisputes();
  }

  @Patch('disputes/:id/resolve')
  @ApiOperation({ summary: 'Resolve a disputed transaction' })
  async resolveDispute(
    @Param('id') id: string,
    @Body() dto: ResolveDisputeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminService.resolveDispute(
      id,
      req.user.userId,
      dto.decision as TransactionStatus,
      dto.notes,
    );
  }
}
