import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoxDto } from './dto/create-box.dto';

@Injectable()
export class BoxService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoxDto) {
    const existingQr = await this.prisma.movableBox.findUnique({
      where: { qrCode: dto.qrCode },
    });
    if (existingQr) {
      throw new BadRequestException(`Box with QR code ${dto.qrCode} already exists`);
    }

    const existingLabel = await this.prisma.movableBox.findUnique({
      where: { label: dto.label },
    });
    if (existingLabel) {
      throw new BadRequestException(`Box with label ${dto.label} already exists`);
    }

    if (dto.slotId) {
      const slot = await this.prisma.slot.findUnique({
        where: { id: dto.slotId },
      });
      if (!slot) throw new NotFoundException(`Slot ${dto.slotId} not found`);
    }

    // Determine initial status based on slot assignment
    const initialStatus = dto.slotId ? 'ACTIVE' : 'INACTIVE';

    const box = await this.prisma.movableBox.create({
      data: {
        qrCode: dto.qrCode,
        label: dto.label,
        slotId: dto.slotId || null,
        capacity: 10,
        occupiedCount: 0,
        status: initialStatus,
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

  async findAll(status?: 'ACTIVE' | 'FULL' | 'INACTIVE', search?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const where: any = {};
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

  async findOne(id: string) {
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

    if (!box) throw new NotFoundException(`Box ${id} not found`);
    return this.formatBox(box);
  }

  async findByQr(qrCode: string) {
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

    if (!box) throw new NotFoundException(`Box with QR ${qrCode} not found`);
    return this.formatBox(box);
  }

  async remove(id: string) {
    const box = await this.prisma.movableBox.findUnique({
      where: { id },
      include: { passports: { select: { id: true } } },
    });

    if (!box) throw new NotFoundException(`Box ${id} not found`);
    if (box.passports.length > 0) {
      throw new BadRequestException('Cannot delete a box that contains active passports');
    }

    await this.prisma.movableBox.delete({ where: { id } });
    return { message: 'Box deleted successfully' };
  }

  private formatBox(box: any) {
    let location: string | null = null;
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
}
