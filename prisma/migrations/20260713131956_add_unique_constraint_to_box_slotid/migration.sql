/*
  Warnings:

  - A unique constraint covering the columns `[slotId]` on the table `movable_boxes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "movable_boxes_slotId_key" ON "movable_boxes"("slotId");
