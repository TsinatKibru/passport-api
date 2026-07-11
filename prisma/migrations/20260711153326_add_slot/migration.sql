/*
  Warnings:

  - You are about to drop the column `rowId` on the `movable_boxes` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "movable_boxes" DROP CONSTRAINT "movable_boxes_rowId_fkey";

-- AlterTable
ALTER TABLE "movable_boxes" DROP COLUMN "rowId",
ADD COLUMN     "slotId" TEXT;

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowId" TEXT NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slots_qrCode_key" ON "slots"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "slots_rowId_name_key" ON "slots"("rowId", "name");

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "rows"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movable_boxes" ADD CONSTRAINT "movable_boxes_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
