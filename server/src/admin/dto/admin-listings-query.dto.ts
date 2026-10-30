import { IsIn, IsOptional, IsString } from 'class-validator';
import { ListingStatus, ListingType } from '../../listings/schemas/listing.schema';

export class AdminListingsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(Object.values(ListingStatus))
  status?: ListingStatus;

  @IsOptional()
  @IsIn(Object.values(ListingType))
  type?: ListingType;

  @IsOptional()
  @IsString()
  category?: string;
}