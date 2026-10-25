
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Transaction,
  TransactionSchema,
} from './schemas/transaction.schema';
import { Listing, ListingSchema } from '../listings/schemas/listing.schema';
import {
  Offer,
  OfferSchema,
} from '../offers/schemas/offer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: Offer.name, schema: OfferSchema },
{name: Listing.name, schema:ListingSchema}
    ]),
NotificationsModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
