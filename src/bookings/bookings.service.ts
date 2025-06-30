import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    return this.prisma.$transaction(async (prisma) =>{
      await prisma.$executeRawUnsafe(`
        SELECT id FROM "Booking" 
        WHERE "roomId" = $1 AND "isDeleted" = false
        FOR UPDATE
      `, data.roomId);

      const overlappingBookings = await this.prisma.booking.findFirst({
        where: {
          roomId: data.roomId,
          isDeleted: false,
          OR: [
            {
              startTime: { lt: end },
              endTime: { gt: start },
            },
          ],
        },
      });

      if (overlappingBookings) {
        throw new BadRequestException('This room is already booked for the selected time period');
      }

      try {
        return await this.prisma.booking.create({
          data: {
            roomId: data.roomId,
            userId: data.userId,
            startTime: start,
            endTime: end,
          },
          include: { room: true, user: true },
        });
      } catch (error) {
        if (
          error.code === 'P2002' &&
          error.meta?.target?.includes('userId_roomId_startTime_endTime')
        ) {
          throw new ConflictException('Exact same booking already exists');
        }
        throw error;
      }
    })
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: { room: true, user: true },
      where: { isDeleted: false },
    });
  }

  async findById(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id, isDeleted: false },
      include: { room: true, user: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async remove(bookingId: number, requestingUserId: number, role: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking || booking.isDeleted) {
      throw new NotFoundException('Booking not found');
    }

    const isOwner = booking.userId === requestingUserId;

    if (role !== 'admin' && !isOwner) {
      throw new ForbiddenException('You can only delete your own bookings');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { isDeleted: true },
    });
  }
}
