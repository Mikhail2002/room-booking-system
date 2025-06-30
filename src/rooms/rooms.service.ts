import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateRoomDto) {
    return this.prisma.room.create({ data });
  }

  async findAll() {
    return this.prisma.room.findMany();
  }

  async findById(id: number) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException(`Room with id ${id} not found`);
    return room;
  }

  async findAvailableRooms(start: string, end: string) {
    const startTime = new Date(start);
    const endTime = new Date(end);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || startTime >= endTime) {
      throw new BadRequestException('Invalid start or end time');
    }

    const allRooms = await this.prisma.room.findMany();

    const bookings = await this.prisma.booking.findMany({
      where: {
        isDeleted: false,
        OR: [
          {
            startTime: { lt: endTime },
            endTime: { gt: startTime },
          },
        ],
      },
    });

    const busyRoomIds = new Set(bookings.map((b) => b.roomId));

    const availableRooms = allRooms.filter((room) => !busyRoomIds.has(room.id));

    return availableRooms;
  }

  async update(id: number, data: Partial<CreateRoomDto>) {
    await this.findById(id);
    return this.prisma.room.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findById(id);
    return this.prisma.room.delete({ where: { id } });
  }
}
