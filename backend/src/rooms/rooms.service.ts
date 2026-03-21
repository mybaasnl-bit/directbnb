import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateRoomDto) {
    await this.assertPropertyOwnership(dto.propertyId, ownerId);

    return this.prisma.room.create({
      data: {
        propertyId: dto.propertyId,
        name: dto.name,
        descriptionNl: dto.descriptionNl,
        descriptionEn: dto.descriptionEn,
        pricePerNight: dto.pricePerNight,
        maxGuests: dto.maxGuests ?? 2,
        isActive: dto.isActive ?? true,
      },
      include: { photos: true },
    });
  }

  async findAllByProperty(propertyId: string, ownerId: string) {
    await this.assertPropertyOwnership(propertyId, ownerId);

    return this.prisma.room.findMany({
      where: { propertyId },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { sortOrder: 'asc' } },
        property: true,
      },
    });

    if (!room) throw new NotFoundException('Room not found');
    if (room.property.ownerId !== ownerId) throw new ForbiddenException();

    return room;
  }

  async update(id: string, ownerId: string, dto: UpdateRoomDto) {
    const room = await this.findOne(id, ownerId);
    await this.assertPropertyOwnership(room.propertyId, ownerId);

    return this.prisma.room.update({
      where: { id },
      data: dto,
      include: { photos: true },
    });
  }

  async remove(id: string, ownerId: string) {
    const room = await this.findOne(id, ownerId);
    await this.assertPropertyOwnership(room.propertyId, ownerId);
    await this.prisma.room.delete({ where: { id } });
    return { message: 'Room deleted successfully' };
  }

  async addPhoto(
    roomId: string,
    ownerId: string,
    photo: { url: string; altText?: string },
  ) {
    await this.findOne(roomId, ownerId);
    return this.prisma.roomPhoto.create({
      data: { roomId, url: photo.url, altText: photo.altText },
    });
  }

  async removePhoto(photoId: string, ownerId: string) {
    const photo = await this.prisma.roomPhoto.findUnique({
      where: { id: photoId },
      include: { room: { include: { property: true } } },
    });

    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.room.property.ownerId !== ownerId) throw new ForbiddenException();

    await this.prisma.roomPhoto.delete({ where: { id: photoId } });
    return { message: 'Photo removed' };
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertPropertyOwnership(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException();
    return property;
  }
}
