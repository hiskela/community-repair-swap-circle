
import {
  Controller,
  Get,
  UseGuards,
  Body,
  Param,
  Req,
  Patch,
Query,
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
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AdminListingsQueryDto } from './dto/admin-listings-query.dto';
import { UpdateListingVisibilityDto } from './dto/update-listing-visibility.dto';

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
@Get('users')
@ApiOperation({ summary: 'Get and filter all users' })
getUsers(@Query() filters: AdminUsersQueryDto) {
  return this.adminService.getUsers(filters);
}

@Get('users/:id')
@ApiOperation({ summary: 'Get user details' })
getUserById(@Param('id') id: string) {
  return this.adminService.getUserById(id);
}

@Patch('users/:id/status')
@ApiOperation({ summary: 'Activate or deactivate a user' })
updateUserStatus(
  @Param('id') id: string,
  @Body() dto: UpdateUserStatusDto,
  @Req() req: AuthenticatedRequest,
) {
  return this.adminService.updateUserStatus(
    id,
    dto.isActive,
    req.user.userId,
  );
}
@Get('listings')
@ApiOperation({ summary: 'Get and filter all listings' })
getListings(@Query() filters: AdminListingsQueryDto) {
  return this.adminService.getListings(filters);
}

@Get('listings/:id')
@ApiOperation({ summary: 'Get listing details' })
getListingById(@Param('id') id: string) {
  return this.adminService.getListingById(id);
}

@Patch('listings/:id/visibility')
@ApiOperation({ summary: 'Hide or republish a listing' })
updateListingVisibility(
  @Param('id') id: string,
  @Body() dto: UpdateListingVisibilityDto,
) {
  return this.adminService.updateListingVisibility(
    id,
    dto.hidden,
  );
}
}
