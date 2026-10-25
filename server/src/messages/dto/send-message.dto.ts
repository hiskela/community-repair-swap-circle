
import { IsMongoId, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsMongoId()
  transactionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
