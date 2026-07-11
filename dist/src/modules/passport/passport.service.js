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
exports.PassportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PassportService = class PassportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existing = await this.prisma.passport.findUnique({
            where: { qrCode: dto.qrCode },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Passport with QR code ${dto.qrCode} already exists`);
        }
        return this.prisma.passport.create({
            data: {
                qrCode: dto.qrCode,
                holderName: dto.holderName,
                holderIdNo: dto.holderIdNo,
                status: 'ISSUED',
            },
        });
    }
    async findAll(status, search, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { holderName: { contains: search, mode: 'insensitive' } },
                { holderIdNo: { contains: search, mode: 'insensitive' } },
                { qrCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.passport.findMany({
                where,
                include: {
                    box: {
                        include: {
                            slot: {
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
                            },
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.passport.count({ where }),
        ]);
        const formattedData = data.map((passport) => {
            let location = null;
            if (passport.box?.slot) {
                const slot = passport.box.slot;
                location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
            }
            return {
                ...passport,
                location,
            };
        });
        return {
            data: formattedData,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const passport = await this.prisma.passport.findUnique({
            where: { id },
            include: {
                box: {
                    include: {
                        slot: {
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
                        },
                    },
                },
            },
        });
        if (!passport)
            throw new common_1.NotFoundException(`Passport ${id} not found`);
        let location = null;
        if (passport.box?.slot) {
            const slot = passport.box.slot;
            location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
        }
        return {
            ...passport,
            location,
        };
    }
    async findByQr(qrCode) {
        const passport = await this.prisma.passport.findUnique({
            where: { qrCode },
            include: {
                box: {
                    include: {
                        slot: {
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
                        },
                    },
                },
            },
        });
        if (!passport)
            throw new common_1.NotFoundException(`Passport with QR ${qrCode} not found`);
        let location = null;
        if (passport.box?.slot) {
            const slot = passport.box.slot;
            location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
        }
        return {
            ...passport,
            location,
        };
    }
    async remove(id) {
        const passport = await this.prisma.passport.findUnique({ where: { id } });
        if (!passport)
            throw new common_1.NotFoundException(`Passport ${id} not found`);
        if (passport.status === 'IN_BOX') {
            throw new common_1.BadRequestException('Cannot delete a passport that is currently inside a box');
        }
        await this.prisma.passport.delete({ where: { id } });
        return { message: 'Passport deleted successfully' };
    }
};
exports.PassportService = PassportService;
exports.PassportService = PassportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PassportService);
//# sourceMappingURL=passport.service.js.map