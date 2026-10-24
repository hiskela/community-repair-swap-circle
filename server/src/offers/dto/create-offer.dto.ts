import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateOfferDto {
  @IsMongoId()
  listingId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  message: string;
}