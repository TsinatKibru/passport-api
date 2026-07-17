-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LogAction" ADD VALUE 'ROOM_CREATED';
ALTER TYPE "LogAction" ADD VALUE 'ROOM_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'ROOM_DELETED';
ALTER TYPE "LogAction" ADD VALUE 'SHELF_CREATED';
ALTER TYPE "LogAction" ADD VALUE 'SHELF_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'SHELF_DELETED';
ALTER TYPE "LogAction" ADD VALUE 'ROW_CREATED';
ALTER TYPE "LogAction" ADD VALUE 'ROW_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'ROW_DELETED';
ALTER TYPE "LogAction" ADD VALUE 'SLOT_CREATED';
ALTER TYPE "LogAction" ADD VALUE 'SLOT_UPDATED';
ALTER TYPE "LogAction" ADD VALUE 'SLOT_DELETED';
