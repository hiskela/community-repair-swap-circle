import { IsIn } from 'class-validator';

export class RespondCancellationDto {
  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';
}