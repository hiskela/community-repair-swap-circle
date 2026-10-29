
import {
  Injectable,
  NotFoundException,
  BadRequestException,
ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, QueryFilter } from 'mongoose';
import { UpdateListingDto } from './dto/update-listing.dto';
import { Offer, OfferDocument, OfferStatus } from '../offers/schemas/offer.schema';

import {
  Listing,
  ListingDocument,
  ListingStatus,
} from './schemas/listing.schema';
import {
  Transaction,
  TransactionDocument,
  TransactionStatus,
} from '../transactions/schemas/transaction.schema';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';


@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  @InjectModel(Offer.name)
  private readonly offerModel: Model<OfferDocument>,

  @InjectModel(Transaction.name)
  private readonly transactionModel: Model<TransactionDocument>,
  ) {}

  async create(createListingDto: CreateListingDto, userId: string) {
    const listing = await this.listingModel.create({
      ...createListingDto,
      owner: userId,
    });

    return listing;
  }

 
async findAll(searchDto: SearchListingsDto) {
  const {
    keyword,
    type,
    category,
    location,
    page = 1,
    limit = 10,
  } = searchDto;

  const filter: QueryFilter<ListingDocument> = {
    status: ListingStatus.OPEN,
  };

  if (type) {
    filter.type = type;
  }

  if (category?.trim()) {
    filter.category = {
      $regex: this.escapeRegex(category.trim()),
      $options: 'i',
    };
  }

  if (location?.trim()) {
    filter.location = {
      $regex: this.escapeRegex(location.trim()),
      $options: 'i',
    };
  }

  if (keyword?.trim()) {
    const safeKeyword = this.escapeRegex(keyword.trim());

    filter.$or = [
      { title: { $regex: safeKeyword, $options: 'i' } },
      { description: { $regex: safeKeyword, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [listings, total] = await Promise.all([
    this.listingModel
      .find(filter)
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),

    this.listingModel.countDocuments(filter).exec(),
  ]);

  return {
    data: listings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
async findMyListings(userId: string) {
  return this.listingModel
    .find({ owner: userId })
    .populate('owner', 'name')
    .sort({ createdAt: -1 })
    .exec();
}
private escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


  async findOne(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid listing ID');
    }

    const listing = await this.listingModel
      .findOne({ _id: id, status: ListingStatus.OPEN })
      .populate('owner', 'name')
      .exec();

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    return listing;
  }


async update(
  id: string,
  userId: string,
  updateListingDto: UpdateListingDto,
) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('Invalid listing ID');
  }

  const listing = await this.listingModel.findById(id).exec();

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ForbiddenException(
      'You can only update your own listings',
    );
  }

  if (listing.status !== ListingStatus.OPEN) {
    throw new BadRequestException(
      'Only open listings can be updated',
    );
  }

  const updates: Partial<UpdateListingDto> = {};

  if (updateListingDto.title !== undefined) {
    updates.title = updateListingDto.title.trim();
  }

  if (updateListingDto.description !== undefined) {
    updates.description = updateListingDto.description.trim();
  }

  if (updateListingDto.type !== undefined) {
    updates.type = updateListingDto.type;
  }

  if (updateListingDto.category !== undefined) {
    updates.category = updateListingDto.category.trim();
  }

  if (updateListingDto.location !== undefined) {
    updates.location = updateListingDto.location.trim();
  }
if(updateListingDto.wantedItem !==undefined){
updates.wantedItem=updateListingDto.wantedItem.trim()

}
  return this.listingModel
    .findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true },
    )
    .exec();
}


async remove(id: string, userId: string) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('Invalid listing ID');
  }

  const listing = await this.listingModel.findById(id).exec();

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ForbiddenException(
      'You can only delete your own listings',
    );
  }

  if (listing.status !== ListingStatus.OPEN) {
    throw new BadRequestException(
      'Only open listings can be deleted',
    );
  }

  const pendingOffers = await this.offerModel.countDocuments({
    listing: listing._id,
    status: OfferStatus.PENDING,
  }).exec();

  if (pendingOffers > 0) {
    throw new BadRequestException(
      'This listing cannot be deleted while it has pending offers. Reject or withdraw the offers first.',
    );
  }

  const activeTransactions = await this.transactionModel.countDocuments({
    listing: listing._id,
    status: {
      $in: [
        TransactionStatus.AGREED,
        TransactionStatus.IN_PROGRESS,
        TransactionStatus.DISPUTED,
      ],
    },
  }).exec();

  if (activeTransactions > 0) {
    throw new BadRequestException(
      'This listing cannot be deleted while it has an active transaction.',
    );
  }

  await listing.deleteOne();

  return { message: 'Listing deleted successfully' };
}

async setVisibility(
  id: string,
  userId: string,
  hidden: boolean,
) {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('Invalid listing ID');
  }

  const listing = await this.listingModel.findById(id).exec();

  if (!listing) {
    throw new NotFoundException('Listing not found');
  }

  if (listing.owner.toString() !== userId) {
    throw new ForbiddenException(
      'You can only change your own listings',
    );
  }

  if (
    listing.status !== ListingStatus.OPEN &&
    listing.status !== ListingStatus.HIDDEN
  ) {
    throw new BadRequestException(
      'Only open or hidden listings can change visibility',
    );
  }

  listing.status = hidden
    ? ListingStatus.HIDDEN
    : ListingStatus.OPEN;

  await listing.save();

  return listing;
}
}
