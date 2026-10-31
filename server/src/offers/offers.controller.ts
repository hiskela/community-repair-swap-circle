import {
  Body,
  Controller,
  Post,
  Request,
  Patch,
  Param,
  UseGuards,
  Get,
Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OffersService } from './offers.service';
import { UpdateOfferDto } from './dto/update-offer.dto';
@ApiTags('Offers')
@ApiBearerAuth()
@Controller('offers')
@UseGuards(JwtAuthGuard)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Submit an offer on a listing' })
  create(
    @Body() createOfferDto: CreateOfferDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.offersService.create(createOfferDto, req.user.userId);
  }
 @Get('sent')
  @ApiOperation({ summary: 'View offers you submitted' })
  findSent(@Request() req: { user: { userId: string } }) {
    return this.offersService.findSent(req.user.userId);
  }

  @Get('received')
  @ApiOperation({ summary: 'View offers on your listings' })
  findReceived(@Request() req: { user: { userId: string } }) {
    return this.offersService.findReceived(req.user.userId);
  }

 
  @Get(':id')
  @ApiOperation({ summary: 'View details of an offer you are involved in' })
  findOne(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.offersService.findOne(id, req.user.userId);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an offer' })
  accept(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.offersService.accept(id, req.user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject an offer' })
  reject(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.offersService.reject(id, req.user.userId);
  }
@Patch(':id/withdraw')
withdraw(
  @Param('id') offerId: string,
  @Req() req: { user: { userId: string } },
) {
  return this.offersService.withdraw(offerId, req.user.userId);
}
@Patch(':id/hide')
@ApiOperation({ summary: 'Remove an offer from your sent offers list' })
hide(
  @Param('id') offerId: string,
  @Req() req: { user: { userId: string } },
) {
  return this.offersService.hide(
    offerId,
    req.user.userId,
  );
}
@Patch(':id')
update(
  @Param('id') offerId: string,
  @Body() dto: UpdateOfferDto,
  @Req() req: { user: { userId: string } },
) {
  return this.offersService.update(
    offerId,
    req.user.userId,
    dto.message,
  );
}
@Patch(':id/hide-received')
@ApiOperation({
  summary: 'Remove an offer from the received offers list',
})
hideReceived(
  @Param('id') offerId: string,
  @Req() req: { user: { userId: string } },
) {
  return this.offersService.hideReceived(
    offerId,
    req.user.userId,
  );
}
}
