
import {
  Injectable,
  NotFoundException,
  BadRequestException,
ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UpdateListingDto } from './dto/update-listing.dto';
import {
  Listing,
  ListingDocument,
  ListingStatus,
} from './schemas/listing.schema';
import { CreateListingDto } from './dto/create-listing.dto';
@Injectable()
export class ListingsService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  async create(createListingDto: CreateListingDto, userId: string) {
    const listing = await this.listingModel.create({
      ...createListingDto,
      owner: userId,
    });

    return listing;
  }

  async findAll() {
    return this.listingModel
      .find({ status: ListingStatus.OPEN })
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .exec();
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

  await listing.deleteOne();

  return { message: 'Listing deleted successfully' };
}
}1
