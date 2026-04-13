import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyExtraDto } from './dto/create-property-extra.dto';
import { UpdatePropertyExtraDto } from './dto/update-property-extra.dto';

@Injectable()
export class PropertyExtrasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(propertyId: string, ownerId: string) {
    await this.assertOwnership(propertyId, ownerId);
    return this.prisma.propertyExtra.findMany({
      where: { propertyId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(propertyId: string, ownerId: string, dto: CreatePropertyExtraDto) {
    await this.assertOwnership(propertyId, ownerId);
    return this.prisma.propertyExtra.create({
      data: {
        propertyId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        pricePer: dto.pricePer ?? 'STAY',
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(propertyId: string, extraId: string, ownerId: string, dto: UpdatePropertyExtraDto) {
    await this.assertOwnership(propertyId, ownerId);
    const extra = await this.prisma.propertyExtra.findUnique({ where: { id: extraId } });
    if (!extra || extra.propertyId !== propertyId) throw new NotFoundException('Extra not found');

    return this.prisma.propertyExtra.update({
      where: { id: extraId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.pricePer !== undefined && { pricePer: dto.pricePer }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async remove(propertyId: string, extraId: string, ownerId: string) {
    await this.assertOwnership(propertyId, ownerId);
    const extra = await this.prisma.propertyExtra.findUnique({ where: { id: extraId } });
    if (!extra || extra.propertyId !== propertyId) throw new NotFoundException('Extra not found');
    await this.prisma.propertyExtra.delete({ where: { id: extraId } });
    return { message: 'Extra deleted' };
  }

  /** Public: fetch active extras for a property (used on booking page) */
  async findPublic(propertyId: string) {
    return this.prisma.propertyExtra.findMany({
      where: { propertyId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private async assertOwnership(propertyId: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.ownerId !== ownerId) throw new ForbiddenException();
    return property;
  }
}
