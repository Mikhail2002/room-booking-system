/*
  Warnings:

  - A unique constraint covering the columns `[userId,roomId,startTime,endTime]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Booking_userId_roomId_startTime_endTime_key" ON "Booking"("userId", "roomId", "startTime", "endTime");
