import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoxDto } from './dto/create-box.dto';
export declare class BoxService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateBoxDto): Promise<any>;
    findAll(status?: 'ACTIVE' | 'FULL' | 'INACTIVE', search?: string, page?: number, limit?: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<any>;
    findByQr(qrCode: string): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private formatBox;
}
