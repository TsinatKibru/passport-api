-- CreateEnum
CREATE TYPE "BoxStatus" AS ENUM ('ACTIVE', 'FULL', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('IN_BOX', 'ISSUED');

-- CreateEnum
CREATE TYPE "LogAction" AS ENUM ('PASSPORT_ASSIGNED', 'PASSPORT_RETURNED', 'PASSPORT_ISSUED', 'BOX_MOVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelves" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roomId" TEXT NOT NULL,

    CONSTRAINT "shelves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rows" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "shelfId" TEXT NOT NULL,

    CONSTRAINT "rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movable_boxes" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "occupiedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BoxStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "rowId" TEXT,

    CONSTRAINT "movable_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passports" (
    "id" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderIdNo" TEXT NOT NULL,
    "status" "PassportStatus" NOT NULL DEFAULT 'IN_BOX',
    "dateReturned" TIMESTAMP(3),
    "dateIssued" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "boxId" TEXT,

    CONSTRAINT "passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movement_logs" (
    "id" TEXT NOT NULL,
    "action" "LogAction" NOT NULL,
    "fromLocation" TEXT,
    "toLocation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passportId" TEXT,
    "boxId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "movement_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rooms_name_key" ON "rooms"("name");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_qrCode_key" ON "rooms"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_qrCode_key" ON "shelves"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "shelves_roomId_name_key" ON "shelves"("roomId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "rows_qrCode_key" ON "rows"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "rows_shelfId_name_key" ON "rows"("shelfId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "movable_boxes_qrCode_key" ON "movable_boxes"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "movable_boxes_label_key" ON "movable_boxes"("label");

-- CreateIndex
CREATE UNIQUE INDEX "passports_qrCode_key" ON "passports"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "passports_holderIdNo_key" ON "passports"("holderIdNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rows" ADD CONSTRAINT "rows_shelfId_fkey" FOREIGN KEY ("shelfId") REFERENCES "shelves"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movable_boxes" ADD CONSTRAINT "movable_boxes_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "rows"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passports" ADD CONSTRAINT "passports_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "movable_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_logs" ADD CONSTRAINT "movement_logs_passportId_fkey" FOREIGN KEY ("passportId") REFERENCES "passports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_logs" ADD CONSTRAINT "movement_logs_boxId_fkey" FOREIGN KEY ("boxId") REFERENCES "movable_boxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movement_logs" ADD CONSTRAINT "movement_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
