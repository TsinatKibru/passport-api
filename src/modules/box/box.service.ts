import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoxDto } from './dto/create-box.dto';
import { DEFAULT_BOX_CAPACITY } from '../../common/constants/box.constants';
import { computeBoxStatus } from '../../common/utils/box-status.util';
import { buildLocationPath } from '../../common/utils/location.util';

@Injectable()
export class BoxService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBoxDto) {
    // Use transaction to ensure slot validation and box creation are atomic
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.slotId) {
          const slot = await tx.slot.findUnique({
            where: { id: dto.slotId },
          });
          if (!slot) throw new NotFoundException(`Slot ${dto.slotId} not found`);
        }

        // Determine initial status based on slot assignment
        const capacity = dto.capacity || DEFAULT_BOX_CAPACITY;
        const initialStatus = computeBoxStatus(dto.slotId, 0, capacity);

        const box = await tx.movableBox.create({
          data: {
            qrCode: dto.qrCode,
            label: dto.label,
            slotId: dto.slotId || null,
            capacity,
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
      });
    } catch (error: any) {
      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'qrCode') {
          throw new BadRequestException(`Box with QR code "${dto.qrCode}" already exists`);
        } else if (field === 'label') {
          throw new BadRequestException(`Box with label "${dto.label}" already exists`);
        }
      }
      // Re-throw other errors (including NotFoundException)
      throw error;
    }
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
    return {
      ...box,
      vacantCount: box.capacity - box.occupiedCount,
      location: buildLocationPath(box.slot),
    };
  }
}
