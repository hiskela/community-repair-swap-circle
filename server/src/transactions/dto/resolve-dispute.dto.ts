
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionStatus } from '../schemas/transaction.schema';

export class ResolveDisputeDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  resolutionNotes: string;
}
