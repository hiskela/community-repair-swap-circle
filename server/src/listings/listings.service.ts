
import {
  Injectable,
  NotFoundException,
  BadRequestException,
ForbiddenException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, QueryFilter } from 'mongoose';
import { UpdateListingDto } from './dto/update-listing.dto';
import {
  Listing,
  ListingDocument,
  ListingStatus,
} from './schemas/listing.schema';
import { CreateListingDto } from './dto/create-listing.dto';
import { SearchListingsDto } from './dto/search-listings.dto';


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
