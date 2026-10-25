import { IsEnum } from 'class-validator';
import { TransactionStatus } from '../schemas/transaction.schema';

export class UpdateTransactionStatusDto {
  @IsEnum(TransactionStatus)
  status: TransactionStatus;
}