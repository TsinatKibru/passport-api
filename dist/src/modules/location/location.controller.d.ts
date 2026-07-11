import { LocationService } from './location.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { CreateRowDto } from './dto/create-row.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
export declare class LocationController {
    private readonly locationService;
    constructor(locationService: LocationService);
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
    getLogs(page?: string, limit?: string): Promise<{
        data: ({
            passport: {
                id: string;
                qrCode: string;
                holderName: string;
            } | null;
            box: {
                id: string;
                qrCode: string;
                label: string;
            } | null;
            user: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            action: import("@prisma/client").$Enums.LogAction;
            fromLocation: string | null;
            toLocation: string | null;
            notes: string | null;
            passportId: string | null;
            boxId: string | null;
            userId: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}
