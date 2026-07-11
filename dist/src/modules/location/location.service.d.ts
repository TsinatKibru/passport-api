import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { CreateRowDto } from './dto/create-row.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
export declare class LocationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRooms(): Promise<({
        _count: {
            shelves: number;
        };
    } & {
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    createRoom(dto: CreateRoomDto): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteRoom(id: string): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getShelves(roomId?: string): Promise<({
        room: {
            id: string;
            name: string;
        };
        _count: {
            rows: number;
        };
    } & {
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        roomId: string;
    })[]>;
    createShelf(dto: CreateShelfDto): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        roomId: string;
    }>;
    deleteShelf(id: string): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        roomId: string;
    }>;
    getRows(shelfId?: string): Promise<({
        _count: {
            slots: number;
        };
        shelf: {
            room: {
                id: string;
                name: string;
            };
            id: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        shelfId: string;
    })[]>;
    createRow(dto: CreateRowDto): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        shelfId: string;
    }>;
    deleteRow(id: string): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        shelfId: string;
    }>;
    getSlots(rowId?: string): Promise<({
        row: {
            id: string;
            name: string;
            shelf: {
                room: {
                    id: string;
                    name: string;
                };
                id: string;
                name: string;
            };
        };
        boxes: {
            id: string;
            qrCode: string;
            label: string;
            capacity: number;
            occupiedCount: number;
            status: import("@prisma/client").$Enums.BoxStatus;
        }[];
    } & {
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        rowId: string;
    })[]>;
    createSlot(dto: CreateSlotDto): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        rowId: string;
    }>;
    deleteSlot(id: string): Promise<{
        id: string;
        name: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        position: number;
        rowId: string;
    }>;
    getSlotByQr(qrCode: string): Promise<{
        id: string;
        name: string;
        qrCode: string;
        position: number;
        location: string;
        row: {
            id: string;
            name: string;
        };
        shelf: {
            id: string;
            name: string;
        };
        room: {
            id: string;
            name: string;
        };
        boxes: {
            id: string;
            qrCode: string;
            label: string;
            capacity: number;
            occupiedCount: number;
            status: import("@prisma/client").$Enums.BoxStatus;
        }[];
    }>;
    moveBox(boxId: string, newSlotId: string, userId: string): Promise<{
        slot: ({
            row: {
                shelf: {
                    room: {
                        id: string;
                        name: string;
                        qrCode: string;
                        createdAt: Date;
                        updatedAt: Date;
                    };
                } & {
                    id: string;
                    name: string;
                    qrCode: string;
                    createdAt: Date;
                    updatedAt: Date;
                    position: number;
                    roomId: string;
                };
            } & {
                id: string;
                name: string;
                qrCode: string;
                createdAt: Date;
                updatedAt: Date;
                position: number;
                shelfId: string;
            };
        } & {
            id: string;
            name: string;
            qrCode: string;
            createdAt: Date;
            updatedAt: Date;
            position: number;
            rowId: string;
        }) | null;
    } & {
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        label: string;
        capacity: number;
        occupiedCount: number;
        status: import("@prisma/client").$Enums.BoxStatus;
        slotId: string | null;
    }>;
    batchAssignPassportsToBox(passportIds: string[], boxId: string, slotQrCode: string | undefined, overrideLocation: boolean, userId: string, action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED'): Promise<{
        success: boolean;
        count: number;
    }>;
    assignPassportToBox(passportId: string, boxId: string, action: 'PASSPORT_ASSIGNED' | 'PASSPORT_RETURNED', userId: string, slotQrCode?: string, overrideLocation?: boolean): Promise<{
        success: boolean;
        count: number;
    }>;
    getMovementLogs(page?: number, limit?: number): Promise<{
        data: ({
            passport: {
                id: string;
                qrCode: string;
                holderName: string;
            } | null;
            user: {
                id: string;
                name: string;
                email: string;
            };
            box: {
                id: string;
                qrCode: string;
                label: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            boxId: string | null;
            action: import("@prisma/client").$Enums.LogAction;
            fromLocation: string | null;
            toLocation: string | null;
            notes: string | null;
            passportId: string | null;
            userId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    issuePassport(passportId: string, userId: string): Promise<{
        id: string;
        qrCode: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PassportStatus;
        holderName: string;
        holderIdNo: string;
        dateReturned: Date | null;
        dateIssued: Date | null;
        boxId: string | null;
    }>;
    getAvailableBoxes(neededSpaces: number): Promise<{
        id: string;
        qrCode: string;
        label: string;
        capacity: number;
        occupiedCount: number;
        vacantCount: number;
        status: import("@prisma/client").$Enums.BoxStatus;
        location: string;
    }[]>;
}
