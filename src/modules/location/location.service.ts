import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LogAction, Prisma } from '@prisma/client';
import { LocationValidationService } from '../../common/services/location-validation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { CreateRowDto } from './dto/create-row.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateShelfDto } from './dto/update-shelf.dto';
import { UpdateRowDto } from './dto/update-row.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import { DEFAULT_BOX_CAPACITY } from '../../common/constants/box.constants';
import { computeBoxStatus } from '../../common/utils/box-status.util';
import { buildLocationPath } from '../../common/utils/location.util';

type SlotWithPath = Prisma.SlotGetPayload<{
  include: { row: { include: { shelf: { include: { room: true } } } } };
}>;

type BoxWithSlot = Prisma.MovableBoxGetPayload<{
  include: { slot: { include: { row: { include: { shelf: { include: { room: true } } } } } } };
}>;

@Injectable()
export class LocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locationValidation: LocationValidationService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // ROOMS
  // ─────────────────────────────────────────────────────────────

  async getRooms() {
    return this.prisma.room.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { shelves: true } } },
    });
  }

  async createRoom(dto: CreateRoomDto, userId: string) {
    try {
      const room = await this.prisma.room.create({ data: dto });
      await this.prisma.movementLog.create({
        data: {
          action: LogAction.ROOM_CREATED,
          toLocation: room.name,
          notes: `Created room "${room.name}"`,
          userId,
        },
      });
      return room;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another room`);
        } else if (target?.includes('name')) {
          throw new ConflictException(`Room name "${dto.name}" already exists. Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to create room');
    }
  }

  async updateRoom(id: string, dto: UpdateRoomDto, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException(`Room ${id} not found`);

    try {
      const updated = await this.prisma.room.update({
        where: { id },
        data: dto,
      });

      if (dto.name && dto.name !== room.name) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.ROOM_UPDATED,
            fromLocation: room.name,
            toLocation: updated.name,
            notes: `Renamed room from "${room.name}" to "${updated.name}"`,
            userId,
          },
        });
      } else if (dto.qrCode && dto.qrCode !== room.qrCode) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.ROOM_UPDATED,
            fromLocation: room.name,
            toLocation: updated.name,
            notes: `Updated QR code for room "${updated.name}"`,
            userId,
          },
        });
      }
      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another room`);
        } else if (target?.includes('name')) {
          throw new ConflictException(`Room name "${dto.name}" already exists. Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to update room');
    }
  }

  async deleteRoom(id: string, userId: string) {
    const room = await this.prisma.room.findUnique({ 
      where: { id },
      include: { _count: { select: { shelves: true } } }
    });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    
    if (room._count.shelves > 0) {
      throw new BadRequestException(
        `Room "${room.name}" contains ${room._count.shelves} active shelf/shelves. Delete shelves first.`
      );
    }

    const deleted = await this.prisma.room.delete({ where: { id } });

    await this.prisma.movementLog.create({
      data: {
        action: LogAction.ROOM_DELETED,
        fromLocation: deleted.name,
        notes: `Deleted room "${deleted.name}"`,
        userId,
      },
    });

    return deleted;
  }

  // ─────────────────────────────────────────────────────────────
  // SHELVES
  // ─────────────────────────────────────────────────────────────

  async getShelves(roomId?: string) {
    return this.prisma.shelf.findMany({
      where: roomId ? { roomId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        room: { select: { id: true, name: true } },
        _count: { select: { rows: true } },
      },
    });
  }

  async createShelf(dto: CreateShelfDto, userId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException(`Room ${dto.roomId} not found`);
    try {
      const shelf = await this.prisma.shelf.create({ data: dto });
      await this.prisma.movementLog.create({
        data: {
          action: LogAction.SHELF_CREATED,
          toLocation: `${room.name} / ${shelf.name}`,
          notes: `Created shelf "${shelf.name}" in room "${room.name}"`,
          userId,
        },
      });
      return shelf;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another shelf`);
        } else if (target?.includes('roomId') && target?.includes('name')) {
          throw new ConflictException(`A shelf named "${dto.name}" already exists in room "${room.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to create shelf');
    }
  }

  async updateShelf(id: string, dto: UpdateShelfDto, userId: string) {
    const shelf = await this.prisma.shelf.findUnique({ 
      where: { id },
      include: { room: true }
    });
    if (!shelf) throw new NotFoundException(`Shelf ${id} not found`);

    let targetRoom = shelf.room;
    if (dto.roomId && dto.roomId !== shelf.roomId) {
      const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
      if (!room) throw new NotFoundException(`Room ${dto.roomId} not found`);
      targetRoom = room;
    }

    try {
      const updated = await this.prisma.shelf.update({
        where: { id },
        data: dto,
      });

      if (dto.name && dto.name !== shelf.name) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SHELF_UPDATED,
            fromLocation: `${shelf.room.name} / ${shelf.name}`,
            toLocation: `${targetRoom.name} / ${updated.name}`,
            notes: `Renamed shelf from "${shelf.name}" to "${updated.name}" in room "${targetRoom.name}"`,
            userId,
          },
        });
      } else if (dto.roomId && dto.roomId !== shelf.roomId) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SHELF_UPDATED,
            fromLocation: `${shelf.room.name} / ${shelf.name}`,
            toLocation: `${targetRoom.name} / ${updated.name}`,
            notes: `Moved shelf "${updated.name}" from room "${shelf.room.name}" to "${targetRoom.name}"`,
            userId,
          },
        });
      } else if (dto.qrCode && dto.qrCode !== shelf.qrCode) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SHELF_UPDATED,
            fromLocation: `${shelf.room.name} / ${shelf.name}`,
            toLocation: `${targetRoom.name} / ${updated.name}`,
            notes: `Updated QR code for shelf "${updated.name}" in room "${targetRoom.name}"`,
            userId,
          },
        });
      }
      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another shelf`);
        } else if (target?.includes('roomId') && target?.includes('name')) {
          throw new ConflictException(`A shelf named "${dto.name}" already exists in room "${targetRoom.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to update shelf');
    }
  }

  async deleteShelf(id: string, userId: string) {
    const shelf = await this.prisma.shelf.findUnique({ 
      where: { id },
      include: { room: true, _count: { select: { rows: true } } }
    });
    if (!shelf) throw new NotFoundException(`Shelf ${id} not found`);

    if (shelf._count.rows > 0) {
      throw new BadRequestException(
        `Shelf "${shelf.name}" contains ${shelf._count.rows} active row(s). Delete rows first.`
      );
    }

    const deleted = await this.prisma.shelf.delete({ where: { id } });

    await this.prisma.movementLog.create({
      data: {
        action: LogAction.SHELF_DELETED,
        fromLocation: `${shelf.room.name} / ${deleted.name}`,
        notes: `Deleted shelf "${deleted.name}" inside room "${shelf.room.name}"`,
        userId,
      },
    });

    return deleted;
  }

  // ─────────────────────────────────────────────────────────────
  // ROWS
  // ─────────────────────────────────────────────────────────────

  async getRows(shelfId?: string) {
    return this.prisma.row.findMany({
      where: shelfId ? { shelfId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        shelf: { select: { id: true, name: true, room: { select: { id: true, name: true } } } },
        _count: { select: { slots: true } },
      },
    });
  }

  async createRow(dto: CreateRowDto, userId: string) {
    const shelf = await this.prisma.shelf.findUnique({ where: { id: dto.shelfId }, include: { room: true } });
    if (!shelf) throw new NotFoundException(`Shelf ${dto.shelfId} not found`);
    try {
      const row = await this.prisma.row.create({ data: dto });
      await this.prisma.movementLog.create({
        data: {
          action: LogAction.ROW_CREATED,
          toLocation: `${shelf.room.name} / ${shelf.name} / ${row.name}`,
          notes: `Created row "${row.name}" in shelf "${shelf.name}" (room "${shelf.room.name}")`,
          userId,
        },
      });
      return row;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another row`);
        } else if (target?.includes('shelfId') && target?.includes('name')) {
          throw new ConflictException(`A row named "${dto.name}" already exists in shelf "${shelf.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to create row');
    }
  }

  async updateRow(id: string, dto: UpdateRowDto, userId: string) {
    const row = await this.prisma.row.findUnique({ 
      where: { id },
      include: { shelf: { include: { room: true } } }
    });
    if (!row) throw new NotFoundException(`Row ${id} not found`);

    let targetShelf = row.shelf;
    if (dto.shelfId && dto.shelfId !== row.shelfId) {
      const shelf = await this.prisma.shelf.findUnique({ where: { id: dto.shelfId }, include: { room: true } });
      if (!shelf) throw new NotFoundException(`Shelf ${dto.shelfId} not found`);
      targetShelf = shelf;
    }

    try {
      const updated = await this.prisma.row.update({
        where: { id },
        data: dto,
      });

      const oldPath = `${row.shelf.room.name} / ${row.shelf.name} / ${row.name}`;
      const newPath = `${targetShelf.room.name} / ${targetShelf.name} / ${updated.name}`;

      if (dto.name && dto.name !== row.name) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.ROW_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Renamed row from "${row.name}" to "${updated.name}" on shelf "${targetShelf.name}"`,
            userId,
          },
        });
      } else if (dto.shelfId && dto.shelfId !== row.shelfId) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.ROW_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Moved row "${updated.name}" from shelf "${row.shelf.name}" to "${targetShelf.name}"`,
            userId,
          },
        });
      } else if (dto.qrCode && dto.qrCode !== row.qrCode) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.ROW_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Updated QR code for row "${updated.name}"`,
            userId,
          },
        });
      }
      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another row`);
        } else if (target?.includes('shelfId') && target?.includes('name')) {
          throw new ConflictException(`A row named "${dto.name}" already exists in shelf "${targetShelf.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to update row');
    }
  }

  async deleteRow(id: string, userId: string) {
    const row = await this.prisma.row.findUnique({ 
      where: { id },
      include: { shelf: { include: { room: true } }, _count: { select: { slots: true } } }
    });
    if (!row) throw new NotFoundException(`Row ${id} not found`);

    if (row._count.slots > 0) {
      throw new BadRequestException(
        `Row "${row.name}" contains ${row._count.slots} active slot(s). Delete slots first.`
      );
    }

    const deleted = await this.prisma.row.delete({ where: { id } });

    await this.prisma.movementLog.create({
      data: {
        action: LogAction.ROW_DELETED,
        fromLocation: `${row.shelf.room.name} / ${row.shelf.name} / ${deleted.name}`,
        notes: `Deleted row "${deleted.name}" inside shelf "${row.shelf.name}"`,
        userId,
      },
    });

    return deleted;
  }

  // ─────────────────────────────────────────────────────────────
  // SLOTS
  // ─────────────────────────────────────────────────────────────

  async getSlots(rowId?: string, page?: number, limit?: number, search?: string) {
    // If rowId is provided, use hierarchical loading (no pagination)
    if (rowId) {
      return this.prisma.slot.findMany({
        where: { rowId },
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

    // Paginated response for slot picker
    const pageNum = page || 1;
    const limitNum = limit || 15;
    const skip = (pageNum - 1) * limitNum;

    // Build search filter
    const searchFilter = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { qrCode: { contains: search, mode: 'insensitive' as const } },
            { row: { name: { contains: search, mode: 'insensitive' as const } } },
            { row: { shelf: { name: { contains: search, mode: 'insensitive' as const } } } },
            { row: { shelf: { room: { name: { contains: search, mode: 'insensitive' as const } } } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.slot.findMany({
        where: searchFilter,
        orderBy: [
          { row: { shelf: { room: { name: 'asc' } } } },
          { row: { shelf: { name: 'asc' } } },
          { row: { name: 'asc' } },
          { position: 'asc' },
        ],
        skip,
        take: limitNum,
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
      }),
      this.prisma.slot.count({ where: searchFilter }),
    ]);

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async createSlot(dto: CreateSlotDto, userId: string) {
    const row = await this.prisma.row.findUnique({ 
      where: { id: dto.rowId },
      include: { shelf: { include: { room: true } } }
    });
    if (!row) throw new NotFoundException(`Row ${dto.rowId} not found`);
    try {
      const slot = await this.prisma.slot.create({ data: dto });
      await this.prisma.movementLog.create({
        data: {
          action: LogAction.SLOT_CREATED,
          toLocation: `${row.shelf.room.name} / ${row.shelf.name} / ${row.name} / ${slot.name}`,
          notes: `Created slot "${slot.name}" in row "${row.name}" (shelf "${row.shelf.name}", room "${row.shelf.room.name}")`,
          userId,
        },
      });
      return slot;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another slot`);
        } else if (target?.includes('rowId') && target?.includes('name')) {
          throw new ConflictException(`A slot named "${dto.name}" already exists in row "${row.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to create slot');
    }
  }

  async updateSlot(id: string, dto: UpdateSlotDto, userId: string) {
    const slot = await this.prisma.slot.findUnique({ 
      where: { id },
      include: { row: { include: { shelf: { include: { room: true } } } } }
    });
    if (!slot) throw new NotFoundException(`Slot ${id} not found`);

    let targetRow = slot.row;
    if (dto.rowId && dto.rowId !== slot.rowId) {
      const row = await this.prisma.row.findUnique({ where: { id: dto.rowId }, include: { shelf: { include: { room: true } } } });
      if (!row) throw new NotFoundException(`Row ${dto.rowId} not found`);
      targetRow = row;
    }

    try {
      const updated = await this.prisma.slot.update({
        where: { id },
        data: dto,
      });

      const oldPath = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
      const newPath = `${targetRow.shelf.room.name} / ${targetRow.shelf.name} / ${targetRow.name} / ${updated.name}`;

      if (dto.name && dto.name !== slot.name) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SLOT_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Renamed slot from "${slot.name}" to "${updated.name}" in row "${targetRow.name}"`,
            userId,
          },
        });
      } else if (dto.rowId && dto.rowId !== slot.rowId) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SLOT_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Moved slot "${updated.name}" from row "${slot.row.name}" to "${targetRow.name}"`,
            userId,
          },
        });
      } else if (dto.qrCode && dto.qrCode !== slot.qrCode) {
        await this.prisma.movementLog.create({
          data: {
            action: LogAction.SLOT_UPDATED,
            fromLocation: oldPath,
            toLocation: newPath,
            notes: `Updated QR code for slot "${updated.name}"`,
            userId,
          },
        });
      }
      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const target = error.meta?.target;
        if (target?.includes('qrCode')) {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another slot`);
        } else if (target?.includes('rowId') && target?.includes('name')) {
          throw new ConflictException(`A slot named "${dto.name}" already exists in row "${targetRow.name}". Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to update slot');
    }
  }

  async deleteSlot(id: string, userId: string) {
    const slot = await this.prisma.slot.findUnique({ 
      where: { id },
      include: { row: { include: { shelf: { include: { room: true } } } }, boxes: true } 
    });
    if (!slot) throw new NotFoundException(`Slot ${id} not found`);
    if (slot.boxes && slot.boxes.length > 0) {
      const labels = slot.boxes.map((b) => b.label).join(', ');
      throw new BadRequestException(
        `Slot "${slot.name}" still contains box(es): ${labels}. Move or remove them first.`,
      );
    }
    
    const deleted = await this.prisma.slot.delete({ where: { id } });

    await this.prisma.movementLog.create({
      data: {
        action: LogAction.SLOT_DELETED,
        fromLocation: `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${deleted.name}`,
        notes: `Deleted slot "${deleted.name}" inside row "${slot.row.name}"`,
        userId,
      },
    });

    return deleted;
  }


  /** QR-based slot lookup — used by the mobile app during scan verification */
  async getSlotByQr(qrCode: string) {
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

    if (!result) throw new NotFoundException(`Slot with QR "${qrCode}" not found`);

    return {
      id: result.id,
      name: result.name,
      qrCode: result.qrCode,
      position: result.position,
      location: buildLocationPath(result),
      row: { id: result.row.id, name: result.row.name },
      shelf: { id: result.row.shelf.id, name: result.row.shelf.name },
      room: { id: result.row.shelf.room.id, name: result.row.shelf.room.name },
      boxes: result.boxes,
    };
  }


  /**
   * Move a box to a new slot and cascade the new location to every passport inside.
   *
   * CONVENTION (see CONVENTIONS.md §3):
   *   This is the ONLY place that writes to movableBox location fields,
   *   passport.boxId indirectly via box moves, and movementLog for BOX_MOVED.
   *   All operations happen in a single transaction — partial updates are
   *   data corruption.
   */
  async moveBox(boxId: string, newSlotId: string, userId: string) {
    // 1. Load the box with its current location and all passports inside
    const box = await this.prisma.movableBox.findUnique({
      where: { id: boxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
        passports: { select: { id: true } },
      },
    });

    if (!box) throw new NotFoundException(`Box ${boxId} not found`);

    // 2. Load the destination slot with its full location path
    const newSlot = await this.prisma.slot.findUnique({
      where: { id: newSlotId },
      include: { row: { include: { shelf: { include: { room: true } } } } },
    });

    if (!newSlot) throw new NotFoundException(`Slot ${newSlotId} not found`);

    // 3. Check if destination slot is already occupied (prevent conflicts)
    if (box.slotId !== newSlotId) {
      const existingBox = await this.prisma.movableBox.findFirst({
        where: { 
          slotId: newSlotId,
          id: { not: boxId } // Exclude the box being moved
        },
        select: { id: true, label: true }
      });

      if (existingBox) {
        const slotLocation = buildLocationPath(newSlot);
        throw new ConflictException(
          `Slot is already occupied by box ${existingBox.label} at ${slotLocation}. ` +
          `Please choose a different slot or move ${existingBox.label} first.`
        );
      }
    }

    // Build human-readable location strings for the audit log
    const fromLocation = buildLocationPath(box.slot);
    const toLocation = buildLocationPath(newSlot);

    // Compute new status using centralized logic
    const newStatus = computeBoxStatus(newSlotId, box.occupiedCount, box.capacity);

    // 4. Execute all writes in one transaction — rollback everything on failure
    try {
      const updatedBox = await this.prisma.$transaction(async (tx) => {
        // Update box location and status
        const movedBox = await tx.movableBox.update({
          where: { id: boxId },
          data: { 
            slotId: newSlotId,
            status: newStatus,
          },
          include: {
            slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
          },
        });

        // Write the BOX_MOVED audit log entry
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
    } catch (error) {
      // Handle unique constraint violation
      if (error.code === 'P2002' && error.meta?.target?.includes('slotId')) {
        const slotLocation = buildLocationPath(newSlot);
        throw new ConflictException(
          `This slot at ${slotLocation} is already occupied by another box. ` +
          `Please choose a different slot.`
        );
      }
      throw error;
    }
  }



  /**
   * Assign a single passport - simplified version without enhanced verification.
   * For compatibility with existing mobile app calls that don't use box QR verification.
   */
  private validatePassportsForBoxAction(
    passports: { id: string; qrCode: string; holderName: string; status: string }[],
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED',
  ) {
    const invalid = passports.filter((p) => p.status !== 'ISSUED');
    if (invalid.length === 0) return;

    const names = invalid.map((p) => `${p.holderName} (${p.qrCode})`).join(', ');
    const verb = action === 'PASSPORT_RETURNED' ? 'returned to storage' : 'assigned to a box';
    throw new BadRequestException(
      `Only ISSUED passports can be ${verb}. Not eligible: ${names}`,
    );
  }

  private async resolveSlotForBoxAssignment(
    box: BoxWithSlot,
    slotQrCode: string | undefined,
    overrideLocation: boolean,
  ): Promise<{ targetSlot: SlotWithPath | null; shouldRelocate: boolean }> {
    if (!slotQrCode) {
      return { targetSlot: box.slot, shouldRelocate: false };
    }

    const scannedSlot = await this.prisma.slot.findUnique({
      where: { qrCode: slotQrCode },
      include: { row: { include: { shelf: { include: { room: true } } } } },
    });

    if (!scannedSlot) {
      throw new NotFoundException(`Slot with QR "${slotQrCode}" not found`);
    }

    if (!overrideLocation) {
      if (box.slotId !== scannedSlot.id) {
        const currentLocation = buildLocationPath(box.slot);
        const scannedLocation = buildLocationPath(scannedSlot);

        throw new ConflictException({
          error: 'LOCATION_MISMATCH',
          currentLocation,
          scannedLocation,
          message: `Box ${box.label} is registered at "${currentLocation}" but found at "${scannedLocation}"`,
        });
      }
      return { targetSlot: scannedSlot, shouldRelocate: false };
    }

    if (box.slotId === scannedSlot.id) {
      return { targetSlot: scannedSlot, shouldRelocate: false };
    }

    const conflict = await this.locationValidation.validateBoxSlotAssignment(
      box.id,
      scannedSlot.id,
    );

    if (!conflict.canOverride) {
      throw new ConflictException({
        error: 'LOCATION_CONFLICT',
        message: conflict.message,
        suggestedAction: conflict.suggestedAction,
      });
    }

    return { targetSlot: scannedSlot, shouldRelocate: true };
  }

  private async relocateBoxInTransaction(
    tx: Prisma.TransactionClient,
    box: BoxWithSlot,
    targetSlot: SlotWithPath,
    userId: string,
  ) {
    const fromLocation = buildLocationPath(box.slot);
    const toLocation = buildLocationPath(targetSlot);
    const newStatus = computeBoxStatus(targetSlot.id, box.occupiedCount, box.capacity);

    await tx.movableBox.update({
      where: { id: box.id },
      data: {
        slotId: targetSlot.id,
        status: newStatus,
      },
    });

    await tx.movementLog.create({
      data: {
        action: 'BOX_MOVED',
        fromLocation,
        toLocation,
        boxId: box.id,
        userId,
      },
    });
  }

  async assignPassportToBox(
    passportId: string,
    boxId: string,
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED',
    userId: string,
    slotQrCode?: string,
    overrideLocation = false,
  ) {
    const box = await this.prisma.movableBox.findUnique({
      where: { id: boxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!box) throw new NotFoundException(`Box ${boxId} not found`);

    if (!box.slotId && !slotQrCode) {
      throw new BadRequestException(`Box ${box.label} is currently not placed in any slot. You must scan a slot QR code first.`);
    }

    if (box.capacity - box.occupiedCount < 1) {
      throw new BadRequestException(`Box ${box.label} is at full capacity`);
    }

    const passport = await this.prisma.passport.findUnique({
      where: { id: passportId },
    });

    if (!passport) throw new NotFoundException(`Passport ${passportId} not found`);

    this.validatePassportsForBoxAction([passport], action);

    const { targetSlot, shouldRelocate } = await this.resolveSlotForBoxAssignment(
      box,
      slotQrCode,
      overrideLocation,
    );

    const toLocation = buildLocationPath(targetSlot ?? box.slot);

    return this.prisma.$transaction(async (tx) => {
      if (shouldRelocate && targetSlot) {
        await this.relocateBoxInTransaction(tx, box, targetSlot, userId);
      }

      const newOccupiedCount = box.occupiedCount + 1;
      const activeSlotId = targetSlot?.id ?? box.slotId;
      const newStatus = computeBoxStatus(activeSlotId, newOccupiedCount, box.capacity);

      await tx.movableBox.update({
        where: { id: boxId },
        data: {
          occupiedCount: newOccupiedCount,
          status: newStatus,
        },
      });

      await tx.passport.update({
        where: { id: passportId },
        data: {
          boxId: boxId,
          status: 'IN_BOX',
          dateReturned: action === 'PASSPORT_RETURNED' ? new Date() : undefined,
        },
      });

      await tx.movementLog.create({
        data: {
          action,
          fromLocation: null,
          toLocation,
          passportId,
          boxId: boxId,
          userId,
        },
      });

      return {
        success: true,
        count: 1,
      };
    });
  }

  /**
   * Batch assign multiple passports - simplified version without enhanced verification.
   * For compatibility with existing mobile app calls that don't use box QR verification.
   */
  async batchAssignPassportsToBox(
    passportIds: string[],
    boxId: string,
    userId: string,
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED',
    slotQrCode?: string,
    overrideLocation = false,
  ) {
    const box = await this.prisma.movableBox.findUnique({
      where: { id: boxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!box) throw new NotFoundException(`Box ${boxId} not found`);

    if (!box.slotId && !slotQrCode) {
      throw new BadRequestException(`Box ${box.label} is currently not placed in any slot. You must scan a slot QR code first.`);
    }

    const needed = passportIds.length;
    const available = box.capacity - box.occupiedCount;
    if (available < needed) {
      throw new BadRequestException(
        `Box ${box.label} does not have enough capacity. Needed: ${needed}, Available: ${available}`,
      );
    }

    const passports = await this.prisma.passport.findMany({
      where: { id: { in: passportIds } },
    });

    if (passports.length !== passportIds.length) {
      throw new NotFoundException('One or more passports not found');
    }

    this.validatePassportsForBoxAction(passports, action);

    const { targetSlot, shouldRelocate } = await this.resolveSlotForBoxAssignment(
      box,
      slotQrCode,
      overrideLocation,
    );

    const toLocation = buildLocationPath(targetSlot ?? box.slot);

    return this.prisma.$transaction(async (tx) => {
      if (shouldRelocate && targetSlot) {
        await this.relocateBoxInTransaction(tx, box, targetSlot, userId);
      }

      const newOccupiedCount = box.occupiedCount + needed;
      const activeSlotId = targetSlot?.id ?? box.slotId;
      const newStatus = computeBoxStatus(activeSlotId, newOccupiedCount, box.capacity);

      await tx.movableBox.update({
        where: { id: boxId },
        data: {
          occupiedCount: newOccupiedCount,
          status: newStatus,
        },
      });

      await tx.passport.updateMany({
        where: { id: { in: passportIds } },
        data: {
          boxId: boxId,
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
            boxId: boxId,
            userId,
          },
        });
      }

      return {
        success: true,
        count: needed,
      };
    });
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────

  async getMovementLogs(options: {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.action) {
      where.action = options.action;
    }

    if (options.userId) {
      where.userId = options.userId;
    }

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) {
        where.createdAt.gte = new Date(options.startDate);
      }
      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (options.search) {
      const searchLower = options.search.trim();
      where.OR = [
        {
          passport: {
            OR: [
              { holderName: { contains: searchLower, mode: 'insensitive' } },
              { qrCode: { contains: searchLower, mode: 'insensitive' } },
            ],
          },
        },
        {
          box: {
            OR: [
              { label: { contains: searchLower, mode: 'insensitive' } },
              { qrCode: { contains: searchLower, mode: 'insensitive' } },
            ],
          },
        },
        {
          user: {
            OR: [
              { name: { contains: searchLower, mode: 'insensitive' } },
              { email: { contains: searchLower, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.movementLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          passport: { select: { id: true, qrCode: true, holderName: true } },
          box: { select: { id: true, qrCode: true, label: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.movementLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Issue a passport to its owner — removes it from the box.
   */
  async issuePassport(passportId: string, userId: string) {
    const passport = await this.prisma.passport.findUnique({
      where: { id: passportId },
      include: {
        box: { include: { slot: { include: { row: { include: { shelf: { include: { room: true } } } } } } } },
      },
    });

    if (!passport) throw new NotFoundException(`Passport ${passportId} not found`);
    if (passport.status === 'ISSUED') {
      throw new BadRequestException(`Passport ${passportId} is already issued`);
    }

    const fromLocation = buildLocationPath(passport.box?.slot);

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
        const box = await tx.movableBox.findUnique({ where: { id: passport.boxId } });
        const newOccupiedCount = (box?.occupiedCount || 1) - 1;
        
        // Compute status using centralized logic
        const newStatus = computeBoxStatus(
          box?.slotId, 
          newOccupiedCount, 
          box?.capacity || DEFAULT_BOX_CAPACITY
        );
        
        await tx.movableBox.update({
          where: { id: passport.boxId },
          data: {
            occupiedCount: { decrement: 1 },
            status: newStatus,
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

  /**
   * Bulk assign multiple boxes to available slots automatically.
   * Finds the first N available slots and assigns boxes sequentially.
   */
  async bulkAssignBoxesToSlots(boxIds: string[], userId: string, roomId?: string) {
    // 1. Validate all boxes exist and are INACTIVE
    const boxes = await this.prisma.movableBox.findMany({
      where: { id: { in: boxIds } },
    });

    if (boxes.length !== boxIds.length) {
      throw new NotFoundException('One or more boxes not found');
    }

    const nonInactiveBoxes = boxes.filter(b => b.status !== 'INACTIVE');
    if (nonInactiveBoxes.length > 0) {
      const labels = nonInactiveBoxes.map(b => b.label).join(', ');
      throw new BadRequestException(
        `These boxes are already assigned to slots: ${labels}. Only INACTIVE boxes can be bulk assigned.`,
      );
    }

    // 2. Find available slots (no boxes assigned)
    const availableSlots = await this.prisma.slot.findMany({
      where: {
        boxes: { none: {} }, // Slots with no boxes
        ...(roomId && {
          row: {
            shelf: {
              roomId: roomId,
            },
          },
        }),
      },
      include: {
        row: {
          include: {
            shelf: {
              include: {
                room: true,
              },
            },
          },
        },
      },
      orderBy: [
        { row: { shelf: { room: { name: 'asc' } } } },
        { row: { shelf: { position: 'asc' } } },
        { row: { position: 'asc' } },
        { position: 'asc' },
      ],
      take: boxIds.length,
    });

    if (availableSlots.length < boxIds.length) {
      throw new BadRequestException(
        `Not enough available slots. Need ${boxIds.length} slots, but only ${availableSlots.length} available${roomId ? ' in selected room' : ''}.`,
      );
    }

    // 3. Perform bulk assignment in transaction
    return this.prisma.$transaction(async (tx) => {
      const assignments = [];

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];
        const slot = availableSlots[i];

        const location = buildLocationPath(slot);

        // Update box: assign to slot and set ACTIVE
        await tx.movableBox.update({
          where: { id: box.id },
          data: {
            slotId: slot.id,
            status: 'ACTIVE', // Auto-activate when assigned
          },
        });

        // Create movement log
        await tx.movementLog.create({
          data: {
            action: 'BOX_MOVED',
            fromLocation: null, // Was unassigned
            toLocation: location,
            boxId: box.id,
            userId,
          },
        });

        assignments.push({
          boxId: box.id,
          boxLabel: box.label,
          slotId: slot.id,
          location,
        });
      }

      return {
        success: true,
        count: assignments.length,
        assignments,
      };
    });
  }

  /**
   * Get available boxes with pagination, search, and filters.
   * 
   * CRITICAL: Used by box assignment modal. With 10,000+ boxes, pagination is required.
   * 
   * @param neededSpaces - Minimum vacant slots required
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default: 20)
   * @param search - Search by label or QR code
   * @param roomId - Filter by room
   * @returns Paginated list of available boxes
   */
  async getAvailableBoxes(
    neededSpaces: number,
    page: number = 1,
    limit: number = 20,
    search?: string,
    roomId?: string,
  ) {
    const skip = (page - 1) * limit;
    const searchPattern = search ? `%${search}%` : null;

    // Use raw query for efficient database-level pagination, sorting, and space computation
    const boxes = await this.prisma.$queryRaw<any[]>`
      SELECT 
        b.id,
        b."qrCode",
        b.label,
        b.capacity,
        b."occupiedCount",
        b.status,
        b."createdAt",
        b."updatedAt",
        b."slotId",
        s.name as "slotName",
        r.name as "rowName",
        sh.name as "shelfName",
        ro.name as "roomName"
      FROM movable_boxes b
      INNER JOIN slots s ON b."slotId" = s.id
      INNER JOIN rows r ON s."rowId" = r.id
      INNER JOIN shelves sh ON r."shelfId" = sh.id
      INNER JOIN rooms ro ON sh."roomId" = ro.id
      WHERE b.status = 'ACTIVE'
        AND b."slotId" IS NOT NULL
        AND (b.capacity - b."occupiedCount") >= ${neededSpaces}
        ${searchPattern ? Prisma.sql`AND (b.label ILIKE ${searchPattern} OR b."qrCode" ILIKE ${searchPattern})` : Prisma.empty}
        ${roomId ? Prisma.sql`AND ro.id = ${roomId}` : Prisma.empty}
      ORDER BY (b.capacity - b."occupiedCount") DESC, b."occupiedCount" ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    const countResult = await this.prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM movable_boxes b
      INNER JOIN slots s ON b."slotId" = s.id
      INNER JOIN rows r ON s."rowId" = r.id
      INNER JOIN shelves sh ON r."shelfId" = sh.id
      INNER JOIN rooms ro ON sh."roomId" = ro.id
      WHERE b.status = 'ACTIVE'
        AND b."slotId" IS NOT NULL
        AND (b.capacity - b."occupiedCount") >= ${neededSpaces}
        ${searchPattern ? Prisma.sql`AND (b.label ILIKE ${searchPattern} OR b."qrCode" ILIKE ${searchPattern})` : Prisma.empty}
        ${roomId ? Prisma.sql`AND ro.id = ${roomId}` : Prisma.empty}
    `;

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const formattedData = boxes.map((box) => ({
      id: box.id,
      qrCode: box.qrCode,
      label: box.label,
      capacity: box.capacity,
      occupiedCount: box.occupiedCount,
      vacantCount: box.capacity - box.occupiedCount,
      status: box.status,
      location: `${box.roomName} / ${box.shelfName} / ${box.rowName} / ${box.slotName}`,
      createdAt: box.createdAt,
      updatedAt: box.updatedAt,
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}
