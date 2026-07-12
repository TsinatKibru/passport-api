import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { CreateRowDto } from './dto/create-row.dto';
import { CreateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class LocationService {
  constructor(private readonly prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────
  // ROOMS
  // ─────────────────────────────────────────────────────────────

  async getRooms() {
    return this.prisma.room.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { shelves: true } } },
    });
  }

  async createRoom(dto: CreateRoomDto) {
    try {
      return await this.prisma.room.create({ data: dto });
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'qrCode') {
          throw new ConflictException(`QR code "${dto.qrCode}" is already in use by another room`);
        } else if (field === 'name') {
          throw new ConflictException(`Room name "${dto.name}" already exists. Please choose a different name.`);
        }
      }
      throw new BadRequestException('Failed to create room');
    }
  }

  async deleteRoom(id: string) {
    const room = await this.prisma.room.findUnique({ where: { id } });
    if (!room) throw new NotFoundException(`Room ${id} not found`);
    return this.prisma.room.delete({ where: { id } });
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

  async createShelf(dto: CreateShelfDto) {
    const room = await this.prisma.room.findUnique({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException(`Room ${dto.roomId} not found`);
    try {
      return await this.prisma.shelf.create({ data: dto });
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

  async deleteShelf(id: string) {
    const shelf = await this.prisma.shelf.findUnique({ where: { id } });
    if (!shelf) throw new NotFoundException(`Shelf ${id} not found`);
    return this.prisma.shelf.delete({ where: { id } });
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

  async createRow(dto: CreateRowDto) {
    const shelf = await this.prisma.shelf.findUnique({ where: { id: dto.shelfId }, include: { room: true } });
    if (!shelf) throw new NotFoundException(`Shelf ${dto.shelfId} not found`);
    try {
      return await this.prisma.row.create({ data: dto });
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

  async deleteRow(id: string) {
    const row = await this.prisma.row.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Row ${id} not found`);
    return this.prisma.row.delete({ where: { id } });
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

  async createSlot(dto: CreateSlotDto) {
    const row = await this.prisma.row.findUnique({ 
      where: { id: dto.rowId },
      include: { shelf: { include: { room: true } } }
    });
    if (!row) throw new NotFoundException(`Row ${dto.rowId} not found`);
    try {
      return await this.prisma.slot.create({ data: dto });
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

  async deleteSlot(id: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id }, include: { boxes: true } });
    if (!slot) throw new NotFoundException(`Slot ${id} not found`);
    if (slot.boxes && slot.boxes.length > 0) {
      const labels = slot.boxes.map((b) => b.label).join(', ');
      throw new BadRequestException(
        `Slot "${slot.name}" still contains box(es): ${labels}. Move or remove them first.`,
      );
    }
    return this.prisma.slot.delete({ where: { id } });
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

    // Narrow nested types through locals to satisfy TS
    const row = result.row as typeof result.row & {
      shelf: { id: string; name: string; room: { id: string; name: string } };
    };
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

    // Build human-readable location strings for the audit log
    const fromLocation = box.slot
      ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
      : null;
    const toLocation = `${newSlot.row.shelf.room.name} / ${newSlot.row.shelf.name} / ${newSlot.row.name} / ${newSlot.name}`;

    // Determine new status: if box was INACTIVE (no slot), make it ACTIVE when assigned
    const newStatus = !box.slotId ? 'ACTIVE' : (box.occupiedCount >= box.capacity ? 'FULL' : 'ACTIVE');

    // 3. Execute all writes in one transaction — rollback everything on failure
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
  }

  /**
   * Batch assign passports to a box (initial placement or return from owner).
   * Enforces capacity, does location slot mismatch check with optional override.
   */
  async batchAssignPassportsToBox(
    passportIds: string[],
    boxId: string,
    slotQrCode: string | undefined,
    overrideLocation: boolean,
    userId: string,
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED',
  ) {
    // 1. Fetch box with current slot info
    const box = await this.prisma.movableBox.findUnique({
      where: { id: boxId },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    if (!box) throw new NotFoundException(`Box ${boxId} not found`);
    if (box.status === 'INACTIVE') {
      throw new BadRequestException(`Box ${box.label} is inactive`);
    }

    // 2. Fetch passports
    const passports = await this.prisma.passport.findMany({
      where: { id: { in: passportIds } },
    });

    if (passports.length !== passportIds.length) {
      throw new NotFoundException('One or more passports not found');
    }

    // 3. Capacity check
    const needed = passportIds.length;
    if (box.occupiedCount + needed > box.capacity) {
      throw new BadRequestException(
        `Box ${box.label} does not have enough capacity. Needed: ${needed}, Available: ${box.capacity - box.occupiedCount}`,
      );
    }

    // 4. Slot Verification & Override Logic
    let targetSlotId = box.slotId;
    let boxMovedLocationChange: { from: string | null; to: string } | null = null;

    if (slotQrCode) {
      const scannedSlot = await this.prisma.slot.findUnique({
        where: { qrCode: slotQrCode },
        include: { row: { include: { shelf: { include: { room: true } } } } },
      });

      if (!scannedSlot) {
        throw new NotFoundException(`Slot with QR code ${slotQrCode} not found`);
      }

      if (box.slotId !== scannedSlot.id) {
        if (!overrideLocation) {
          const currentLoc = box.slot
            ? `${box.slot.row.shelf.room.name} / ${box.slot.row.shelf.name} / ${box.slot.row.name} / ${box.slot.name}`
            : 'Unplaced';
          const scannedLoc = `${scannedSlot.row.shelf.room.name} / ${scannedSlot.row.shelf.name} / ${scannedSlot.row.name} / ${scannedSlot.name}`;
          
          throw new BadRequestException({
            error: 'LOCATION_MISMATCH',
            message: `Box ${box.label} is registered at "${currentLoc}", but physically scanned at "${scannedLoc}". Do you want to override and correct the box location?`,
            currentLocation: currentLoc,
            scannedLocation: scannedLoc,
          });
        } else {
          // Override is true: we update the box location to the scanned slot
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

    // 5. Transaction-wrapped write operation
    return this.prisma.$transaction(async (tx) => {
      // If override location change was triggered, move the box first
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

      // Update box occupancy and status
      const newOccupiedCount = box.occupiedCount + needed;
      // Compute status: INACTIVE if no slot, FULL if at capacity, otherwise ACTIVE
      const newStatus = !targetSlotId 
        ? 'INACTIVE' 
        : (newOccupiedCount >= box.capacity ? 'FULL' : 'ACTIVE');
        
      await tx.movableBox.update({
        where: { id: boxId },
        data: {
          occupiedCount: newOccupiedCount,
          status: newStatus,
        },
      });

      // Update all passports
      await tx.passport.updateMany({
        where: { id: { in: passportIds } },
        data: {
          boxId,
          status: 'IN_BOX',
          dateReturned: action === 'PASSPORT_RETURNED' ? new Date() : undefined,
        },
      });

      // Create movement logs for all passports
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

  /**
   * Assign a single passport (wraps batchAssignPassportsToBox).
   */
  async assignPassportToBox(
    passportId: string,
    boxId: string,
    action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED',
    userId: string,
    slotQrCode?: string,
    overrideLocation = false,
  ) {
    return this.batchAssignPassportsToBox(
      [passportId],
      boxId,
      slotQrCode,
      overrideLocation,
      userId,
      action,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────

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
        const box = await tx.movableBox.findUnique({ where: { id: passport.boxId } });
        const newOccupiedCount = (box?.occupiedCount || 1) - 1;
        
        // Compute status: INACTIVE if no slot, FULL if at capacity, otherwise ACTIVE
        const newStatus = !box?.slotId 
          ? 'INACTIVE' 
          : (newOccupiedCount >= (box?.capacity || 10) ? 'FULL' : 'ACTIVE');
        
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

        const location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;

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

  async getAvailableBoxes(neededSpaces: number) {
    const boxes = await this.prisma.movableBox.findMany({
      where: {
        status: { in: ['ACTIVE'] },
      },
      include: {
        slot: { include: { row: { include: { shelf: { include: { room: true } } } } } },
      },
    });

    // Filter and compute values dynamically
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
      .sort((a, b) => b.vacantCount - a.vacantCount); // Sort by most vacant slots first
  }
}
