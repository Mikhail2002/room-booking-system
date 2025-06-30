import { IsInt, IsDateString } from "class-validator";

export class CreateBookingDto {
  @IsInt()
  roomId: number;

  @IsInt()
  userId: number;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;
}
