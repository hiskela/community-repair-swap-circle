import { IsBoolean } from 'class-validator';

export class UpdateListingVisibilityDto {
  @IsBoolean()
  hidden: boolean;
}