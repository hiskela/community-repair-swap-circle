import {
  IsEnum,
  IsMongoId,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportTargetType } from '../schemas/report.schema';

export class CreateReportDto {
  @IsEnum(ReportTargetType)
  targetType: ReportTargetType;

  @IsMongoId()
  targetId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason: string;
}