
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SafetyModule } from '../safety/safety.module';
import { Transaction, TransactionSchema } from '../transactions/schemas/transaction.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { MessagesService } from './messages.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Message.name, schema: MessageSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
    AuthModule,
    SafetyModule,
  ],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
