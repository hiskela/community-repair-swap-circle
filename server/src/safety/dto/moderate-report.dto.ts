import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ReportStatus } from '../schemas/report.schema';

export class ModerateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  adminNotes?: string;
}