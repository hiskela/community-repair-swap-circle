
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
ConflictException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreateOfferDto } from './dto/create-offer.dto';
import { Offer, OfferDocument, OfferStatus } from './schemas/offer.schema';
import {
  Listing,
  ListingDocument,
  ListingStatus,
} from '../listings/schemas/listing.schema';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name)
    private readonly offerModel: Model<OfferDocument>,

    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  async create(createOfferDto: CreateOfferDto, userId: string) {
    const { listingId, message } = createOfferDto;

    if (!isValidObjectId(listingId)) {
      throw new BadRequestException('Invalid listing ID');
    }

    const listing = await this.listingModel
      .findById(listingId)
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.status !== ListingStatus.OPEN) {
      throw new BadRequestException(
        'You can only make offers on open listings',
      );
    }

    if (listing.owner.toString() === userId) {
      throw new ForbiddenException(
        'You cannot make an offer on your own listing',
      );
    }


    const existingOffer = await this.offerModel
      .findOne({
        listing: listingId,
        sender: userId,
        status: OfferStatus.PENDING,
      })
      .exec();

    if (existingOffer) {
      throw new BadRequestException(
        'You already have a pending offer for this listing',
      );
    }

    return this.offerModel.create({
      listing: listingId,
      sender: userId,
      message: message.trim(),
    });
  }

async findSent(userId: string) {
  return this.offerModel
    .find({ sender: userId })
    .populate({
      path: 'listing',
      select: 'title type category location status',
    })
    .sort({ createdAt: -1 })
    .exec();
}

async findReceived(userId: string) {
  const listings = await this.listingModel
    .find({ owner: userId })
    .select('_id')
    .exec();

  const listingIds = listings.map((listing) => listing._id);

  return this.offerModel
    .find({ listing: { $in: listingIds } })
    .populate('sender', 'name')
    .populate({
      path: 'listing',
      select: 'title type category location status',
    })
    .sort({ createdAt: -1 })
    .exec();
}

async accept(offerId: string, userId: string) {
  if (!isValidObjectId(offerId)) {
    throw new BadRequestException('Invalid offer ID');
  }

  const offer = await this.offerModel.findById(offerId).exec();

  if (!offer) {
    throw new NotFoundException('Offer not found');
  }

  const listing = await this.listingModel
    .findById(offer.listing)
    .exec();

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ForbiddenException(
      'Only the listing owner can accept this offer',
    );
  }

  if (offer.status !== OfferStatus.PENDING) {
    throw new BadRequestException(
      'Only pending offers can be accepted',
    );
  }

  const reservedListing = await this.listingModel.findOneAndUpdate(
    { _id: listing._id, status: ListingStatus.OPEN },
    { $set: { status: ListingStatus.RESERVED } },
    { new: true },
  ).exec();

  if (!reservedListing) {
    throw new ConflictException(
      'This listing is no longer available',
    );
  }

  const acceptedOffer = await this.offerModel.findOneAndUpdate(
    { _id: offer._id, status: OfferStatus.PENDING },
    { $set: { status: OfferStatus.ACCEPTED } },
    { new: true },
  ).exec();

  if (!acceptedOffer) {
    await this.listingModel.updateOne(
      { _id: listing._id, status: ListingStatus.RESERVED },
      { $set: { status: ListingStatus.OPEN } },
    ).exec();

    throw new ConflictException(
      'This offer has already been decided',
    );
  }

  await this.offerModel.updateMany(
    {
      listing: listing._id,
      _id: { $ne: offer._id },
      status: OfferStatus.PENDING,
    },
    { $set: { status: OfferStatus.REJECTED } },
  ).exec();

  return acceptedOffer;
}

async reject(offerId: string, userId: string) {
  if (!isValidObjectId(offerId)) {
    throw new BadRequestException('Invalid offer ID');
  }

  const offer = await this.offerModel.findById(offerId).exec();

  if (!offer) {
    throw new NotFoundException('Offer not found');
  }

  const listing = await this.listingModel
    .findById(offer.listing)
    .exec();

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ForbiddenException(
      'Only the listing owner can reject this offer',
    );
  }

  const rejectedOffer = await this.offerModel.findOneAndUpdate(
    { _id: offer._id, status: OfferStatus.PENDING },
    { $set: { status: OfferStatus.REJECTED } },
    { new: true },
  ).exec();

  if (!rejectedOffer) {
    throw new ConflictException(
      'Only pending offers can be rejected',
    );
  }

  return rejectedOffer;
}


}
