
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
Delete,
Patch,
Query
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { ListingsService } from './listings.service';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a listing' })
  create(
    @Body() createListingDto: CreateListingDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.listingsService.create(
      createListingDto,
      request.user.userId,
    );
  }

 
@Get()
@ApiOperation({ summary: 'Search and browse open listings' })
findAll(@Query() searchDto: SearchListingsDto) {
  return this.listingsService.findAll(searchDto);
}
@Get('my')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get your own listings' })
findMyListings(@Req() request: AuthenticatedRequest) {
  return this.listingsService.findMyListings(
    request.user.userId,
  );
}
  @Get(':id')
  @ApiOperation({ summary: 'View an open listing' })
  findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

@Patch(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Update your own listing' })
update(
  @Param('id') id: string,
  @Body() updateListingDto: UpdateListingDto,
  @Req() request: AuthenticatedRequest,
) {
  return this.listingsService.update(
    id,
    request.user.userId,
    updateListingDto,
  );
}

@Delete(':id')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Delete your own listing' })
remove(
  @Param('id') id: string,
  @Req() request: AuthenticatedRequest,
) {
  return this.listingsService.remove(
    id,
    request.user.userId,
  );
}

}
