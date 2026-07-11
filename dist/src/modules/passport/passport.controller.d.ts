import type { JwtPayload } from '../../common/decorators/current-user.decorator';
import { PassportService } from './passport.service';
import { LocationService } from '../location/location.service';
import { CreatePassportDto } from './dto/create-passport.dto';
import { AssignPassportDto } from './dto/assign-passport.dto';
import { BatchAssignPassportDto } from './dto/batch-assign-passport.dto';
export declare class PassportController {
    private readonly passportService;
    private readonly locationService;
    constructor(passportService: PassportService, locationService: LocationService);
    create(dto: CreatePassportDto): Promise<{
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
    findAll(status?: 'IN_BOX' | 'ISSUED', search?: string, page?: string, limit?: string): Promise<{
        data: {
            location: string | null;
            box: ({
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
            }) | null;
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
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findByQr(qrCode: string): Promise<{
        location: string | null;
        box: ({
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
        }) | null;
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
    findOne(id: string): Promise<{
        location: string | null;
        box: ({
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
        }) | null;
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
    batchAssign(dto: BatchAssignPassportDto, user: JwtPayload): Promise<{
        success: boolean;
        count: number;
    }>;
    assign(id: string, dto: AssignPassportDto, user: JwtPayload): Promise<{
        success: boolean;
        count: number;
    }>;
    returnPassport(id: string, dto: AssignPassportDto, user: JwtPayload): Promise<{
        success: boolean;
        count: number;
    }>;
    issue(id: string, user: JwtPayload): Promise<{
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
    remove(id: string): Promise<{
        message: string;
    }>;
}
