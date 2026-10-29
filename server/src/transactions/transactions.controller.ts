import {
  Controller,
  Get,
  Request,
  Param,
  Body,
  Patch,
Req,
  Delete,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsService } from './transactions.service';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { RequestCancellationDto } from './dto/request-cancellation.dto';
import { RespondCancellationDto } from './dto/respond-cancellation.dto';


@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get('my')
  findMyTransactions(@Request() req: { user: { userId: string } }) {
    return this.transactionsService.findMyTransactions(req.user.userId);
  }
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionStatusDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.transactionsService.updateStatus(id, req.user.userId, dto);
  }
  @Post(':id/cancellation-request')
  requestCancellation(
    @Param('id') id: string,
    @Body() dto: RequestCancellationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.transactionsService.requestCancellation(
      id,
      req.user.userId,
      dto,
    );
  }

  @Patch(':id/cancellation-request/respond')
  respondToCancellation(
    @Param('id') id: string,
    @Body() dto: RespondCancellationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.transactionsService.respondToCancellation(
      id,
      req.user.userId,
      dto,
    );
  }

  @Patch(':id/confirm-completion')
  confirmCompletion(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.transactionsService.confirmCompletion(id, req.user.userId);
  }
  @Post(':id/dispute')
  openDispute(
    @Param('id') id: string,
    @Body() dto: OpenDisputeDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.transactionsService.openDispute(id, req.user.userId, dto);
  }
@Patch(':id/resolve-dispute')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
resolveDispute(
  @Param('id') id: string,
  @Request() req: { user: { userId: string } },
  @Body() dto: ResolveDisputeDto,
) {
  return this.transactionsService.resolveDispute(
    id,
    req.user.userId,
    dto,
  );
}
@Get(':id')
findOne(
  @Param('id') id: string,
  @Request() req: { user: { userId: string } },
) {
  return this.transactionsService.findOne(id, req.user.userId);
}
}
