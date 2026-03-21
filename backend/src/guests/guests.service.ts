import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuestDto } from './dto/create-guest.dto';

export class UpdateGuestDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  notes?: string;
}

@Injectable()
export class GuestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateGuestDto) {
    return this.prisma.guest.create({
      data: {
        ownerId,
        ...dto,
        email: dto.email.toLowerCase().trim(),
      },
    });
  }

  async findAllByOwner(ownerId: string, search?: string) {
    return this.prisma.guest.findMany({
      where: {
        ownerId,
        ...(search && {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, ownerId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id },
      include: {
        bookings: {
          include: { room: { include: { property: true } } },
          orderBy: { checkIn: 'desc' },
        },
      },
    });

    if (!guest) throw new NotFoundException('Guest not found');
    if (guest.ownerId !== ownerId) throw new ForbiddenException();

    return guest;
  }

  async update(id: string, ownerId: string, dto: UpdateGuestDto) {
    await this.assertOwnership(id, ownerId);
    return this.prisma.guest.update({ where: { id }, data: dto });
  }

  async remove(id: string, ownerId: string) {
    await this.assertOwnership(id, ownerId);
    await this.prisma.guest.delete({ where: { id } });
    return { message: 'Guest deleted' };
  }

  private async assertOwnership(id: string, ownerId: string) {
    const guest = await this.prisma.guest.findUnique({ where: { id } });
    if (!guest) throw new NotFoundException('Guest not found');
    if (guest.ownerId !== ownerId) throw new ForbiddenException();
    return guest;
  }
}
