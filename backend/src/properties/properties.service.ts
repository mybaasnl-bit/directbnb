import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import slugify from 'slugify';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const slug = await this.generateSlug(dto.name);

    return this.prisma.property.create({
      data: {
        ownerId,
        slug,
        name: dto.name,
        descriptionNl: dto.descriptionNl,
        descriptionEn: dto.descriptionEn,
        addressStreet: dto.addressStreet,
        addressCity: dto.addressCity,
        addressZip: dto.addressZip,
        addressCountry: dto.addressCountry ?? 'NL',
        isPublished: dto.isPublished ?? false,
      },
      include: { photos: true, rooms: true },
    });
  }

  async findAllByOwner(ownerId: string) {
    return this.prisma.property.findMany({
      where: { ownerId },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { rooms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        rooms: {
          where: { isActive: true },
          include: { photos: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException();

    return property;
  }

  async findAllPublished() {
    return this.prisma.property.findMany({
      where: { isPublished: true },
      select: {
        slug: true,
        name: true,
        addressCity: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const property = await this.prisma.property.findUnique({
      where: { slug, isPublished: true },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        rooms: {
          where: { isActive: true },
          orderBy: { createdAt: 'asc' },
          include: { photos: { orderBy: { sortOrder: 'asc' } } },
        },
        reviews: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!property) throw new NotFoundException('Property not found');

    const reviews = property.reviews ?? [];
    const avgRating =
      reviews.length > 0
        ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
        : null;

    return { ...property, avgRating, reviewCount: reviews.length };
  }

  async submitReview(propertyId: string, dto: CreateReviewDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId, isPublished: true },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.review.create({
      data: {
        propertyId,
        guestFirstName: dto.guestFirstName,
        rating: dto.rating,
        comment: dto.comment,
        cleanlinessRating: dto.cleanlinessRating,
        locationRating: dto.locationRating,
        valueRating: dto.valueRating,
      },
    });
  }

  async update(id: string, ownerId: string, dto: UpdatePropertyDto) {
    await this.assertOwnership(id, ownerId);

    return this.prisma.property.update({
      where: { id },
      data: dto,
      include: { photos: true, rooms: true },
    });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwnership(id, ownerId);
    await this.prisma.property.delete({ where: { id } });
    return { message: 'Property deleted successfully' };
  }

  async addPhoto(
    propertyId: string,
    ownerId: string,
    photo: { url: string; altText?: string; isCover?: boolean },
  ) {
    await this.assertOwnership(propertyId, ownerId);

    if (photo.isCover) {
      await this.prisma.propertyPhoto.updateMany({
        where: { propertyId },
        data: { isCover: false },
      });
    }

    return this.prisma.propertyPhoto.create({
      data: {
        propertyId,
        url: photo.url,
        altText: photo.altText,
        isCover: photo.isCover ?? false,
      },
    });
  }

  async removePhoto(photoId: string, ownerId: string) {
    const photo = await this.prisma.propertyPhoto.findUnique({
      where: { id: photoId },
      include: { property: true },
    });

    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.property.ownerId !== ownerId) throw new ForbiddenException();

    await this.prisma.propertyPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo removed' };
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async assertOwnership(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException();
    return property;
  }

  private async generateSlug(name: string): Promise<string> {
    let base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 1;

    while (await this.prisma.property.findUnique({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }

    return slug;
  }
}
