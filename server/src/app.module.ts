
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {UsersModule} from './users/users.module'
import { AuthModule } from './auth/auth.module';
import { ListingsModule } from './listings/listings.module';
import { OffersModule } from './offers/offers.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AdminModule } from './admin/admin.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
UsersModule,
AuthModule,
ListingsModule,
OffersModule,
TransactionsModule,
AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
