
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { Listing, ListingSchema } from './schemas/listing.schema';
import { Offer, OfferSchema } from '../offers/schemas/offer.schema';
import {
  Transaction,
  TransactionSchema,
} from '../transactions/schemas/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
