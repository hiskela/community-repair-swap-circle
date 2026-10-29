
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveDisputeDto {
  @IsIn(['in_progress', 'cancelled', 'completed'])
  decision: 'in_progress' | 'cancelled' | 'completed';

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  notes: string;
}
