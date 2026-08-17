import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LogAction } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePassportDto } from './dto/create-passport.dto';
import { UpdatePassportDto } from './dto/update-passport.dto';
import { redactName } from '../../common/utils/redact.util';

@Injectable()
export class PassportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePassportDto) {
    try {
      return await this.prisma.passport.create({
        data: {
          qrCode: dto.qrCode,
          holderName: dto.holderName,
          holderIdNo: dto.holderIdNo,
          status: 'ISSUED', // starts as issued (not in box) by default
        },
      });
    } catch (error: any) {
      // Handle Prisma unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'qrCode') {
          throw new BadRequestException(`Passport with QR code "${dto.qrCode}" already exists`);
        } else if (field === 'holderIdNo') {
          throw new BadRequestException(`Passport with ID number "${dto.holderIdNo}" already exists`);
        }
      }
      throw error;
    }
  }

  async findAll(status?: 'IN_BOX' | 'ISSUED', search?: string, page = 1, limit = 10, role?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
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

    const isSearch = search && search.trim().length > 0;

    // Map box location path denormalized and redact if STAFF is browsing without search
    const formattedData = data.map((passport) => {
      let location: string | null = null;
      if (passport.box?.slot) {
        const slot = passport.box.slot;
        location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
      }
      return {
        ...passport,
        holderName: (role === 'STAFF' && !isSearch) ? redactName(passport.holderName) : passport.holderName,
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

  async findOne(id: string) {
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

    if (!passport) throw new NotFoundException(`Passport ${id} not found`);

    let location: string | null = null;
    if (passport.box?.slot) {
      const slot = passport.box.slot;
      location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
    }

    return {
      ...passport,
      location,
    };
  }

  async findByQr(qrCode: string) {
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

    if (!passport) throw new NotFoundException(`Passport with QR ${qrCode} not found`);

    let location: string | null = null;
    if (passport.box?.slot) {
      const slot = passport.box.slot;
      location = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
    }

    return {
      ...passport,
      location,
    };
  }

  async update(id: string, dto: UpdatePassportDto, userId?: string) {
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
    if (!passport) throw new NotFoundException(`Passport ${id} not found`);

    try {
      const updated = await this.prisma.passport.update({
        where: { id },
        data: {
          ...(dto.qrCode !== undefined && { qrCode: dto.qrCode }),
          ...(dto.holderName !== undefined && { holderName: dto.holderName }),
          ...(dto.holderIdNo !== undefined && { holderIdNo: dto.holderIdNo }),
        },
      });

      // Track changes for audit log
      const changes: string[] = [];
      if (dto.holderName && dto.holderName !== passport.holderName) {
        changes.push(`holderName from "${passport.holderName}" to "${dto.holderName}"`);
      }
      if (dto.holderIdNo && dto.holderIdNo !== passport.holderIdNo) {
        changes.push(`holderIdNo from "${passport.holderIdNo}" to "${dto.holderIdNo}"`);
      }
      if (dto.qrCode && dto.qrCode !== passport.qrCode) {
        changes.push(`qrCode from "${passport.qrCode}" to "${dto.qrCode}"`);
      }

      if (changes.length > 0 && userId) {
        let locationPath: string | null = null;
        if (passport.box?.slot) {
          const slot = passport.box.slot;
          locationPath = `${slot.row.shelf.room.name} / ${slot.row.shelf.name} / ${slot.row.name} / ${slot.name}`;
        }

        await this.prisma.movementLog.create({
          data: {
            action: LogAction.PASSPORT_UPDATED,
            fromLocation: locationPath,
            toLocation: locationPath,
            notes: `Updated passport (${passport.holderName}): ${changes.join(', ')}`,
            passportId: passport.id,
            userId,
          },
        });
      }

      return updated;
    } catch (error: any) {
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'qrCode') {
          throw new BadRequestException(`Passport with QR code "${dto.qrCode}" already exists`);
        } else if (field === 'holderIdNo') {
          throw new BadRequestException(`Passport with ID number "${dto.holderIdNo}" already exists`);
        }
      }
      throw error;
    }
  }

  async remove(id: string) {
    const passport = await this.prisma.passport.findUnique({ where: { id } });
    if (!passport) throw new NotFoundException(`Passport ${id} not found`);
    if (passport.status === 'IN_BOX') {
      throw new BadRequestException('Cannot delete a passport that is currently inside a box');
    }

    await this.prisma.passport.delete({ where: { id } });
    return { message: 'Passport deleted successfully' };
  }
}
