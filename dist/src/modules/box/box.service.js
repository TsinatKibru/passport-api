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
exports.BoxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BoxService = class BoxService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        const existingQr = await this.prisma.movableBox.findUnique({
            where: { qrCode: dto.qrCode },
        });
        if (existingQr) {
            throw new common_1.BadRequestException(`Box with QR code ${dto.qrCode} already exists`);
        }
        const existingLabel = await this.prisma.movableBox.findUnique({
            where: { label: dto.label },
        });
        if (existingLabel) {
            throw new common_1.BadRequestException(`Box with label ${dto.label} already exists`);
        }
        if (dto.slotId) {
            const slot = await this.prisma.slot.findUnique({
                where: { id: dto.slotId },
            });
            if (!slot)
                throw new common_1.NotFoundException(`Slot ${dto.slotId} not found`);
        }
        const box = await this.prisma.movableBox.create({
            data: {
                qrCode: dto.qrCode,
                label: dto.label,
                slotId: dto.slotId || null,
                capacity: 10,
                occupiedCount: 0,
                status: 'ACTIVE',
            },
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
        });
        return this.formatBox(box);
    }
    async findAll(status, search, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { label: { contains: search, mode: 'insensitive' } },
                { qrCode: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.movableBox.findMany({
                where,
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
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.movableBox.count({ where }),
        ]);
        return {
            data: data.map((box) => this.formatBox(box)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const box = await this.prisma.movableBox.findUnique({
            where: { id },
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
        });
        if (!box)
            throw new common_1.NotFoundException(`Box ${id} not found`);
        return this.formatBox(box);
    }
    async findByQr(qrCode) {
        const box = await this.prisma.movableBox.findUnique({
            where: { qrCode },
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
        });
        if (!box)
            throw new common_1.NotFoundException(`Box with QR ${qrCode} not found`);
        return this.formatBox(box);
    }
    async remove(id) {
        const box = await this.prisma.movableBox.findUnique({
            where: { id },
            include: { passports: { select: { id: true } } },
        });
        if (!box)
            throw new common_1.NotFoundException(`Box ${id} not found`);
        if (box.passports.length > 0) {
            throw new common_1.BadRequestException('Cannot delete a box that contains active passports');
        }
        await this.prisma.movableBox.delete({ where: { id } });
        return { message: 'Box deleted successfully' };
    }
    formatBox(box) {
        let location = null;
        if (box.slot) {
            const slot = box.slot;
            location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
        }
        return {
            ...box,
            vacantCount: box.capacity - box.occupiedCount,
            location,
        };
    }
};
exports.BoxService = BoxService;
exports.BoxService = BoxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BoxService);
//# sourceMappingURL=box.service.js.map