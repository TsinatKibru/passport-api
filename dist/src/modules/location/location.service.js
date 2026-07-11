"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LocationService = class LocationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRooms() {
        return this.prisma.room.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { shelves: true } } },
        });
    }
    async createRoom(dto) {
        try {
            return await this.prisma.room.create({ data: dto });
        }
        catch {
            throw new common_1.ConflictException(`QR code "${dto.qrCode}" is already in use`);
        }
    }
    async deleteRoom(id) {
        const room = await this.prisma.room.findUnique({ where: { id } });
        if (!room)
            throw new common_1.NotFoundException(`Room ${id} not found`);
        return this.prisma.room.delete({ where: { id } });
    }
    async getShelves(roomId) {
        return this.prisma.shelf.findMany({
            where: roomId ? { roomId } : undefined,
            orderBy: { name: 'asc' },
            include: {
                room: { select: { id: true, name: true } },
                _count: { select: { rows: true } },
            },
        });
    }
    async createShelf(dto) {
        const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
        if (!room)
            throw new common_1.NotFoundException(`Room ${dto.roomId} not found`);
        try {
            return await this.prisma.shelf.create({ data: dto });
        }
        catch {
            throw new common_1.ConflictException(`QR code "${dto.qrCode}" is already in use`);
        }
    }
    async deleteShelf(id) {
        const shelf = await this.prisma.shelf.findUnique({ where: { id } });
        if (!shelf)
            throw new common_1.NotFoundException(`Shelf ${id} not found`);
        return this.prisma.shelf.delete({ where: { id } });
    }
    async getRows(shelfId) {
        return this.prisma.row.findMany({
            where: shelfId ? { shelfId } : undefined,
            orderBy: { name: 'asc' },
            include: {
                shelf: { select: { id: true, name: true, room: { select: { id: true, name: true } } } },
                _count: { select: { slots: true } },
            },
        });
    }
    async createRow(dto) {
        const shelf = await this.prisma.shelf.findUnique({ where: { id: dto.shelfId } });
        if (!shelf)
            throw new common_1.NotFoundException(`Shelf ${dto.shelfId} not found`);
        try {
            return await this.prisma.row.create({ data: dto });
        }
        catch {
            throw new common_1.ConflictException(`QR code "${dto.qrCode}" is already in use`);
        }
    }
    async deleteRow(id) {
        const row = await this.prisma.row.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException(`Row ${id} not found`);
        return this.prisma.row.delete({ where: { id } });
    }
    async getSlots(rowId) {
        return this.prisma.slot.findMany({
            where: rowId ? { rowId } : undefined,
            orderBy: { position: 'asc' },
            include: {
                row: {
                    select: {
                        id: true,
                        name: true,
                        shelf: { select: { id: true, name: true, room: { select: { id: true, name: true } } } },
                    },
                },
                boxes: { select: { id: true, qrCode: true, label: true, occupiedCount: true, capacity: true, status: true } },
            },
        });
    }
    async createSlot(dto) {
        const row = await this.prisma.row.findUnique({ where: { id: dto.rowId } });
        if (!row)
            throw new common_1.NotFoundException(`Row ${dto.rowId} not found`);
        try {
            return await this.prisma.slot.create({ data: dto });
        }
        catch {
            throw new common_1.ConflictException(`QR code "${dto.qrCode}" is already in use`);
        }
    }
    async deleteSlot(id) {
        const slot = await this.prisma.slot.findUnique({ where: { id }, include: { boxes: true } });
        if (!slot)
            throw new common_1.NotFoundException(`Slot ${id} not found`);
        if (slot.boxes && slot.boxes.length > 0) {
            const labels = slot.boxes.map((b) => b.label).join(', ');
            throw new common_1.BadRequestException(`Slot "${slot.name}" still contains box(es): ${labels}. Move or remove them first.`);
        }
        return this.prisma.slot.delete({ where: { id } });
    }
    async getSlotByQr(qrCode) {
        const result = await this.prisma.slot.findUnique({
            where: { qrCode },
            include: {
                row: {
                    include: {
                        shelf: { include: { room: true } },
                    },
                },
                boxes: {
                    select: {
                        id: true,
                        qrCode: true,
                        label: true,
                        occupiedCount: true,
                        capacity: true,
                        status: true,
                    },
                },
            },
        });
        if (!result)
            throw new common_1.NotFoundException(`Slot with QR "${qrCode}" not found`);
        const row = result.row;
        const shelf = row.shelf;
        const room = shelf.room;
        return {
            id: result.id,
            name: result.name,
            qrCode: result.qrCode,
            position: result.position,
            location: `${room.name} / ${shelf.name} / ${row.name} / ${result.name}`,
            row: { id: row.id, name: row.name },
            shelf: { id: shelf.id, name: shelf.name },
            room: { id: room.id, name: room.name },
            boxes: result.boxes,
        };
    }
    async moveBox(boxId, newSlotId, userId) {
        const box = await this.prisma.movableBox.findUnique({
            where: { id: boxId },
            include: {
                slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
                passports: { select: { id: true } },
            },
        });
        if (!box)
            throw new common_1.NotFoundException(`Box ${boxId} not found`);
        if (box.status === 'INACTIVE') {
            throw new common_1.BadRequestException(`Box ${boxId} is inactive and cannot be moved`);
        }
        const newSlot = await this.prisma.slot.findUnique({
            where: { id: newSlotId },
            include: { row: { include: { shelf: { include: { room: true } } } } },
        });
        if (!newSlot)
            throw new common_1.NotFoundException(`Slot ${newSlotId} not found`);
        const fromLocation = box.slot
            ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
            : null;
        const toLocation = `${newSlot.row.shelf.room.name} / ${newSlot.row.shelf.name} / ${newSlot.row.name} / ${newSlot.name}`;
        const updatedBox = await this.prisma.$transaction(async (tx) => {
            const movedBox = await tx.movableBox.update({
                where: { id: boxId },
                data: { slotId: newSlotId },
                include: {
                    slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
                },
            });
            await tx.movementLog.create({
                data: {
                    action: 'BOX_MOVED',
                    fromLocation,
                    toLocation,
                    boxId,
                    userId,
                },
            });
            return movedBox;
        });
        return updatedBox;
    }
    async batchAssignPassportsToBox(passportIds, boxId, slotQrCode, overrideLocation, userId, action) {
        const box = await this.prisma.movableBox.findUnique({
            where: { id: boxId },
            include: {
                slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
            },
        });
        if (!box)
            throw new common_1.NotFoundException(`Box ${boxId} not found`);
        if (box.status === 'INACTIVE') {
            throw new common_1.BadRequestException(`Box ${box.label} is inactive`);
        }
        const passports = await this.prisma.passport.findMany({
            where: { id: { in: passportIds } },
        });
        if (passports.length !== passportIds.length) {
            throw new common_1.NotFoundException('One or more passports not found');
        }
        const needed = passportIds.length;
        if (box.occupiedCount + needed > box.capacity) {
            throw new common_1.BadRequestException(`Box ${box.label} does not have enough capacity. Needed: ${needed}, Available: ${box.capacity - box.occupiedCount}`);
        }
        let targetSlotId = box.slotId;
        let boxMovedLocationChange = null;
        if (slotQrCode) {
            const scannedSlot = await this.prisma.slot.findUnique({
                where: { qrCode: slotQrCode },
                include: { row: { include: { shelf: { include: { room: true } } } } },
            });
            if (!scannedSlot) {
                throw new common_1.NotFoundException(`Slot with QR code ${slotQrCode} not found`);
            }
            if (box.slotId !== scannedSlot.id) {
                if (!overrideLocation) {
                    const currentLoc = box.slot
                        ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
                        : 'Unplaced';
                    const scannedLoc = `${scannedSlot.row.shelf.room.name} / ${scannedSlot.row.shelf.name} / ${scannedSlot.row.name} / ${scannedSlot.name}`;
                    throw new common_1.BadRequestException({
                        error: 'LOCATION_MISMATCH',
                        message: `Box ${box.label} is registered at "${currentLoc}", but physically scanned at "${scannedLoc}". Do you want to override and correct the box location?`,
                        currentLocation: currentLoc,
                        scannedLocation: scannedLoc,
                    });
                }
                else {
                    targetSlotId = scannedSlot.id;
                    boxMovedLocationChange = {
                        from: box.slot
                            ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
                            : null,
                        to: `${scannedSlot.row.shelf.room.name} / ${scannedSlot.row.shelf.name} / ${scannedSlot.row.name} / ${scannedSlot.name}`,
                    };
                }
            }
        }
        const targetSlot = targetSlotId
            ? await this.prisma.slot.findUnique({
                where: { id: targetSlotId },
                include: { row: { include: { shelf: { include: { room: true } } } } },
            })
            : null;
        const toLocation = targetSlot
            ? `${targetSlot.row.shelf.room.name} / ${targetSlot.row.shelf.name} / ${targetSlot.row.name} / ${targetSlot.name}`
            : 'Unplaced';
        return this.prisma.$transaction(async (tx) => {
            if (boxMovedLocationChange) {
                await tx.movableBox.update({
                    where: { id: boxId },
                    data: { slotId: targetSlotId },
                });
                await tx.movementLog.create({
                    data: {
                        action: 'BOX_MOVED',
                        fromLocation: boxMovedLocationChange.from,
                        toLocation: boxMovedLocationChange.to,
                        boxId,
                        userId,
                    },
                });
            }
            const newOccupiedCount = box.occupiedCount + needed;
            await tx.movableBox.update({
                where: { id: boxId },
                data: {
                    occupiedCount: newOccupiedCount,
                    status: newOccupiedCount >= box.capacity ? 'FULL' : 'ACTIVE',
                },
            });
            await tx.passport.updateMany({
                where: { id: { in: passportIds } },
                data: {
                    boxId,
                    status: 'IN_BOX',
                    dateReturned: action === 'PASSPORT_RETURNED' ? new Date() : undefined,
                },
            });
            for (const passportId of passportIds) {
                await tx.movementLog.create({
                    data: {
                        action,
                        fromLocation: null,
                        toLocation,
                        passportId,
                        boxId,
                        userId,
                    },
                });
            }
            return { success: true, count: needed };
        });
    }
    async assignPassportToBox(passportId, boxId, action, userId, slotQrCode, overrideLocation = false) {
        return this.batchAssignPassportsToBox([passportId], boxId, slotQrCode, overrideLocation, userId, action);
    }
    async getMovementLogs(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.movementLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    passport: { select: { id: true, qrCode: true, holderName: true } },
                    box: { select: { id: true, qrCode: true, label: true } },
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            this.prisma.movementLog.count(),
        ]);
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async issuePassport(passportId, userId) {
        const passport = await this.prisma.passport.findUnique({
            where: { id: passportId },
            include: {
                box: { include: { slot: { include: { row: { include: { shelf: { include: { room: true } } } } } } } },
            },
        });
        if (!passport)
            throw new common_1.NotFoundException(`Passport ${passportId} not found`);
        if (passport.status === 'ISSUED') {
            throw new common_1.BadRequestException(`Passport ${passportId} is already issued`);
        }
        const fromLocation = passport.box?.slot
            ? `${passport.box.slot.row.shelf.room.name} / ${passport.box.slot.row.shelf.name} / ${passport.box.slot.row.name} / ${passport.box.slot.name}`
            : 'Unplaced box';
        return this.prisma.$transaction(async (tx) => {
            const updatedPassport = await tx.passport.update({
                where: { id: passportId },
                data: {
                    boxId: null,
                    status: 'ISSUED',
                    dateIssued: new Date(),
                },
            });
            if (passport.boxId) {
                await tx.movableBox.update({
                    where: { id: passport.boxId },
                    data: {
                        occupiedCount: { decrement: 1 },
                        status: 'ACTIVE',
                    },
                });
            }
            await tx.movementLog.create({
                data: {
                    action: 'PASSPORT_ISSUED',
                    fromLocation,
                    toLocation: null,
                    passportId,
                    boxId: passport.boxId,
                    userId,
                },
            });
            return updatedPassport;
        });
    }
    async getAvailableBoxes(neededSpaces) {
        const boxes = await this.prisma.movableBox.findMany({
            where: {
                status: { in: ['ACTIVE'] },
            },
            include: {
                slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
            },
        });
        return boxes
            .map((box) => ({
            id: box.id,
            qrCode: box.qrCode,
            label: box.label,
            capacity: box.capacity,
            occupiedCount: box.occupiedCount,
            vacantCount: box.capacity - box.occupiedCount,
            status: box.status,
            location: box.slot
                ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
                : 'Unplaced',
        }))
            .filter((box) => box.vacantCount >= neededSpaces)
            .sort((a, b) => b.vacantCount - a.vacantCount);
    }
};
exports.LocationService = LocationService;
exports.LocationService = LocationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LocationService);
//# sourceMappingURL=location.service.js.map