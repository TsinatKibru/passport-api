import { PrismaService } from '../../prisma/prisma.service';
import { CreatePassportDto } from './dto/create-passport.dto';
export declare class PassportService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreatePassportDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        qrCode: string;
        status: import("@prisma/client").$Enums.PassportStatus;
        holderName: string;
        holderIdNo: string;
        dateReturned: Date | null;
        dateIssued: Date | null;
        boxId: string | null;
    }>;
    findAll(status?: 'IN_BOX' | 'ISSUED', search?: string, page?: number, limit?: number): Promise<{
        data: {
            location: string | null;
            box: ({
                slot: ({
                    row: {
                        shelf: {
                            room: {
                                id: string;
                                name: string;
                                createdAt: Date;
                                updatedAt: Date;
                                qrCode: string;
                            };
                        } & {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            qrCode: string;
                            position: number;
                            roomId: string;
                        };
                    } & {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        qrCode: string;
                        position: number;
                        shelfId: string;
                    };
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    qrCode: string;
                    position: number;
                    rowId: string;
                }) | null;
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                qrCode: string;
                label: string;
                capacity: number;
                occupiedCount: number;
                status: import("@prisma/client").$Enums.BoxStatus;
                slotId: string | null;
            }) | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
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
    findOne(id: string): Promise<{
        location: string | null;
        box: ({
            slot: ({
                row: {
                    shelf: {
                        room: {
                            id: string;
                            name: string;
                            createdAt: Date;
                            updatedAt: Date;
                            qrCode: string;
                        };
                    } & {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        qrCode: string;
                        position: number;
                        roomId: string;
                    };
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    qrCode: string;
                    position: number;
                    shelfId: string;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                qrCode: string;
                position: number;
                rowId: string;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
            label: string;
            capacity: number;
            occupiedCount: number;
            status: import("@prisma/client").$Enums.BoxStatus;
            slotId: string | null;
        }) | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        qrCode: string;
        status: import("@prisma/client").$Enums.PassportStatus;
        holderName: string;
        holderIdNo: string;
        dateReturned: Date | null;
        dateIssued: Date | null;
        boxId: string | null;
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
                            createdAt: Date;
                            updatedAt: Date;
                            qrCode: string;
                        };
                    } & {
                        id: string;
                        name: string;
                        createdAt: Date;
                        updatedAt: Date;
                        qrCode: string;
                        position: number;
                        roomId: string;
                    };
                } & {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    qrCode: string;
                    position: number;
                    shelfId: string;
                };
            } & {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                qrCode: string;
                position: number;
                rowId: string;
            }) | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            qrCode: string;
            label: string;
            capacity: number;
            occupiedCount: number;
            status: import("@prisma/client").$Enums.BoxStatus;
            slotId: string | null;
        }) | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        qrCode: string;
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
