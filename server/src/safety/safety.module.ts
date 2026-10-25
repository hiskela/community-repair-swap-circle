import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';
import { Block, BlockSchema } from './schemas/block.schema';
import { Report, ReportSchema } from './schemas/report.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Block.name, schema: BlockSchema },
      { name: Report.name, schema: ReportSchema },
{name: User.name, schema:UserSchema},
    ]),
  ],
  controllers: [SafetyController],
  providers: [SafetyService],
})
export class SafetyModule {}