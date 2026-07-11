import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { BoxService } from './box.service';
import { LocationService } from '../location/location.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { MoveBoxDto } from './dto/move-box.dto';
export declare class BoxController {
    private readonly boxService;
    private readonly locationService;
    constructor(boxService: BoxService, locationService: LocationService);
    create(dto: CreateBoxDto): Promise<any>;
    findAll(status?: 'ACTIVE' | 'FULL' | 'INACTIVE', search?: string, page?: string, limit?: string): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAvailable(neededSpaces?: string): Promise<{
        id: string;
        qrCode: string;
        label: string;
        capacity: number;
        occupiedCount: number;
        vacantCount: number;
        status: import("@prisma/client").$Enums.BoxStatus;
        location: string;
    }[]>;
    findByQr(qrCode: string): Promise<any>;
    findOne(id: string): Promise<any>;
    move(id: string, dto: MoveBoxDto, user: JwtPayload): Promise<{
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
    remove(id: string): Promise<{
        message: string;
    }>;
}
