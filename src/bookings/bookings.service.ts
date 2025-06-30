import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) throw new NotFoundException('Room not found');

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundException('User not found');

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    if (start >= end) throw new BadRequestException('startTime must be before endTime');

    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        roomId: data.roomId,
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    });
    if (overlappingBookings.length > 0) {
      throw new BadRequestException('Booking time is already taken');
    }

    return this.prisma.booking.create({
      data: {
        roomId: data.roomId,
        userId: data.userId,
        startTime: start,
        endTime: end,
      },
      include: { room: true, user: true },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: { room: true, user: true },
    });
  }

  async findById(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { room: true, user: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async remove(bookingId: number, requestingUserId: number, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const isOwner = booking.userId === requestingUserId;

    if (role !== 'admin' && !isOwner) {
      throw new ForbiddenException('You can only delete your own bookings');
    }

    return this.prisma.booking.delete({
      where: { id: bookingId },
    });
  }


}
