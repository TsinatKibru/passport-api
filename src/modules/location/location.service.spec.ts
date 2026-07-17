import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LocationValidationService } from '../../common/services/location-validation.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LocationService', () => {
  let service: LocationService;
  let prisma: PrismaService;

  const mockPrismaService = {
    room: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    shelf: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    row: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    slot: {
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    movableBox: {
      count: jest.fn(),
    },
    movementLog: {
      create: jest.fn(),
    },
  };

  const mockLocationValidationService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LocationValidationService, useValue: mockLocationValidationService },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('updateRoom', () => {
    it('should update room and write audit log', async () => {
      const mockRoom = { id: 'room-1', name: 'Old Room', qrCode: 'QR-ROOM-1' };
      const updateDto = { name: 'New Room', qrCode: 'QR-ROOM-2' };
      const mockUpdatedRoom = { id: 'room-1', ...updateDto };

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.room.update.mockResolvedValue(mockUpdatedRoom);
      mockPrismaService.movementLog.create.mockResolvedValue({});

      const result = await service.updateRoom('room-1', updateDto, 'user-admin');

      expect(result).toEqual(mockUpdatedRoom);
      expect(mockPrismaService.room.findUnique).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(mockPrismaService.room.update).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        data: updateDto,
      });
      expect(mockPrismaService.movementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ROOM_UPDATED',
          fromLocation: 'Old Room',
          toLocation: 'New Room',
          userId: 'user-admin',
        }),
      });
    });

    it('should throw NotFoundException if room does not exist', async () => {
      mockPrismaService.room.findUnique.mockResolvedValue(null);

      await expect(service.updateRoom('invalid-id', { name: 'Name' }, 'user-admin'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteRoom', () => {
    it('should delete room successfully if it has no shelves', async () => {
      const mockRoom = { id: 'room-1', name: 'Empty Room', _count: { shelves: 0 } };

      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);
      mockPrismaService.room.delete.mockResolvedValue(mockRoom);
      mockPrismaService.movementLog.create.mockResolvedValue({});

      const result = await service.deleteRoom('room-1', 'user-admin');

      expect(result).toEqual(mockRoom);
      expect(mockPrismaService.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room-1' },
        include: { _count: { select: { shelves: true } } },
      });
      expect(mockPrismaService.room.delete).toHaveBeenCalledWith({ where: { id: 'room-1' } });
      expect(mockPrismaService.movementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ROOM_DELETED',
          fromLocation: 'Empty Room',
          userId: 'user-admin',
        }),
      });
    });

    it('should throw BadRequestException if room has active shelves', async () => {
      const mockRoom = { id: 'room-1', name: 'Busy Room', _count: { shelves: 3 } };
      mockPrismaService.room.findUnique.mockResolvedValue(mockRoom);

      await expect(service.deleteRoom('room-1', 'user-admin'))
        .rejects.toThrow(BadRequestException);
      expect(mockPrismaService.room.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateShelf', () => {
    it('should update shelf and write audit log', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Old Shelf', qrCode: 'QR-1', position: 1, roomId: 'room-1', room: mockRoom };
      const updateDto = { name: 'New Shelf', position: 2 };
      const mockUpdatedShelf = { ...mockShelf, ...updateDto };

      mockPrismaService.shelf.findUnique.mockResolvedValue(mockShelf);
      mockPrismaService.shelf.update.mockResolvedValue(mockUpdatedShelf);
      mockPrismaService.movementLog.create.mockResolvedValue({});

      const result = await service.updateShelf('shelf-1', updateDto, 'user-admin');

      expect(result).toEqual(mockUpdatedShelf);
      expect(mockPrismaService.shelf.update).toHaveBeenCalled();
      expect(mockPrismaService.movementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SHELF_UPDATED',
          fromLocation: 'Room A / Old Shelf',
          toLocation: 'Room A / New Shelf',
        }),
      });
    });
  });

  describe('deleteShelf', () => {
    it('should delete shelf successfully if it has no rows', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Empty Shelf', room: mockRoom, _count: { rows: 0 } };

      mockPrismaService.shelf.findUnique.mockResolvedValue(mockShelf);
      mockPrismaService.shelf.delete.mockResolvedValue(mockShelf);

      const result = await service.deleteShelf('shelf-1', 'user-admin');

      expect(result).toEqual(mockShelf);
      expect(mockPrismaService.shelf.findUnique).toHaveBeenCalledWith({
        where: { id: 'shelf-1' },
        include: { room: true, _count: { select: { rows: true } } },
      });
      expect(mockPrismaService.shelf.delete).toHaveBeenCalledWith({ where: { id: 'shelf-1' } });
    });

    it('should throw BadRequestException if shelf has active rows', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Busy Shelf', room: mockRoom, _count: { rows: 2 } };
      mockPrismaService.shelf.findUnique.mockResolvedValue(mockShelf);

      await expect(service.deleteShelf('shelf-1', 'user-admin'))
        .rejects.toThrow(BadRequestException);
      expect(mockPrismaService.shelf.delete).not.toHaveBeenCalled();
    });
  });

  describe('updateRow', () => {
    it('should update row and write audit log', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Old Row', qrCode: 'QR-1', position: 1, shelfId: 'shelf-1', shelf: mockShelf };
      const updateDto = { name: 'New Row' };
      const mockUpdatedRow = { ...mockRow, ...updateDto };

      mockPrismaService.row.findUnique.mockResolvedValue(mockRow);
      mockPrismaService.row.update.mockResolvedValue(mockUpdatedRow);

      const result = await service.updateRow('row-1', updateDto, 'user-admin');

      expect(result).toEqual(mockUpdatedRow);
      expect(mockPrismaService.movementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'ROW_UPDATED',
          fromLocation: 'Room A / Shelf 1 / Old Row',
          toLocation: 'Room A / Shelf 1 / New Row',
        }),
      });
    });
  });

  describe('deleteRow', () => {
    it('should delete row successfully if it has no slots', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Empty Row', shelf: mockShelf, _count: { slots: 0 } };

      mockPrismaService.row.findUnique.mockResolvedValue(mockRow);
      mockPrismaService.row.delete.mockResolvedValue(mockRow);

      const result = await service.deleteRow('row-1', 'user-admin');

      expect(result).toEqual(mockRow);
      expect(mockPrismaService.row.findUnique).toHaveBeenCalledWith({
        where: { id: 'row-1' },
        include: { shelf: { include: { room: true } }, _count: { select: { slots: true } } },
      });
      expect(mockPrismaService.row.delete).toHaveBeenCalledWith({ where: { id: 'row-1' } });
    });

    it('should throw BadRequestException if row has active slots', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Busy Row', shelf: mockShelf, _count: { slots: 5 } };
      mockPrismaService.row.findUnique.mockResolvedValue(mockRow);

      await expect(service.deleteRow('row-1', 'user-admin'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSlot', () => {
    it('should update slot and write audit log', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Row 1', shelf: mockShelf };
      const mockSlot = { id: 'slot-1', name: 'Old Slot', qrCode: 'QR-1', position: 1, rowId: 'row-1', row: mockRow };
      const updateDto = { name: 'New Slot' };
      const mockUpdatedSlot = { ...mockSlot, ...updateDto };

      mockPrismaService.slot.findUnique.mockResolvedValue(mockSlot);
      mockPrismaService.slot.update.mockResolvedValue(mockUpdatedSlot);

      const result = await service.updateSlot('slot-1', updateDto, 'user-admin');

      expect(result).toEqual(mockUpdatedSlot);
      expect(mockPrismaService.movementLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'SLOT_UPDATED',
          fromLocation: 'Room A / Shelf 1 / Row 1 / Old Slot',
          toLocation: 'Room A / Shelf 1 / Row 1 / New Slot',
        }),
      });
    });
  });

  describe('deleteSlot', () => {
    it('should delete slot successfully if it has no boxes', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Row 1', shelf: mockShelf };
      const mockSlot = { id: 'slot-1', name: 'Empty Slot', row: mockRow, boxes: [] };

      mockPrismaService.slot.findUnique.mockResolvedValue(mockSlot);
      mockPrismaService.slot.delete.mockResolvedValue(mockSlot);

      const result = await service.deleteSlot('slot-1', 'user-admin');

      expect(result).toEqual(mockSlot);
      expect(mockPrismaService.slot.findUnique).toHaveBeenCalledWith({
        where: { id: 'slot-1' },
        include: { row: { include: { shelf: { include: { room: true } } } }, boxes: true },
      });
      expect(mockPrismaService.slot.delete).toHaveBeenCalledWith({ where: { id: 'slot-1' } });
    });

    it('should throw BadRequestException if slot has boxes assigned', async () => {
      const mockRoom = { id: 'room-1', name: 'Room A' };
      const mockShelf = { id: 'shelf-1', name: 'Shelf 1', room: mockRoom };
      const mockRow = { id: 'row-1', name: 'Row 1', shelf: mockShelf };
      const mockSlot = { id: 'slot-1', name: 'Busy Slot', row: mockRow, boxes: [{ id: 'box-1', label: 'MB-001' }] };
      mockPrismaService.slot.findUnique.mockResolvedValue(mockSlot);

      await expect(service.deleteSlot('slot-1', 'user-admin'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
