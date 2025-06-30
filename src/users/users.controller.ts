import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  //user can view his bookings
  //admin can view bookings of any user
  @Get(':id/bookings')
  getUserBookings(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ) {
    const requestingUser = req.user;
    return this.userService.getUserBookings(requestingUser.id, id, requestingUser.role);
  }

}
