
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ListingType } from '../schemas/listing.schema';

export class CreateListingDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsEnum(ListingType)
  type: ListingType;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

@IsOptional()
@IsString()
@MaxLength(200)
wantedItem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;
}
