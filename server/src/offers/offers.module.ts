
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Offer, OfferSchema } from './schemas/offer.schema';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  Listing,
  ListingSchema,
} from '../listings/schemas/listing.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Offer.name, schema: OfferSchema },
      { name: Listing.name, schema: ListingSchema },
    ]),
TransactionsModule,
NotificationsModule,
  ],
  controllers: [OffersController],
  providers: [OffersService],
})
export class OffersModule {}
