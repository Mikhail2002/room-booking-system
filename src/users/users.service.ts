import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
      },
    });
  }

  async getUserBookings(requestingUserId: number, targetUserId: number, role: string) {
  if (role !== 'admin' && requestingUserId !== targetUserId) {
    throw new ForbiddenException('You can only view your own bookings');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      bookings: {
        include: {
          room: true,
        },
      },
    },
  });

  if (!user) throw new NotFoundException('User not found');
  return user.bookings;
}
}
