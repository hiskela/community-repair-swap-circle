import { IsBoolean } from 'class-validator';

export class SetListingVisibilityDto {
  @IsBoolean()
  hidden: boolean;
}