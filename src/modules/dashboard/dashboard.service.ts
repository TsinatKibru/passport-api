import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Dashboard Service
 * 
 * Provides aggregated statistics for the dashboard view.
 * All metrics are computed from the database to ensure accuracy.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   * 
   * Returns:
   * - Passport metrics (total, in box, issued)
   * - Box metrics (total, active, full, inactive)
   * - Room count
   * - Capacity utilization
   * 
   * All queries run in parallel for performance.
   */
  async getStats() {
    const [
      totalPassports,
      inBoxPassports,
      issuedPassports,
      totalBoxes,
      activeBoxes,
      fullBoxes,
      inactiveBoxes,
      totalRooms,
      capacityData,
    ] = await Promise.all([
      // Passport metrics
      this.prisma.passport.count(),
      this.prisma.passport.count({ where: { status: 'IN_BOX' } }),
      this.prisma.passport.count({ where: { status: 'ISSUED' } }),

      // Box metrics by status
      this.prisma.movableBox.count(),
      this.prisma.movableBox.count({ where: { status: 'ACTIVE' } }),
      this.prisma.movableBox.count({ where: { status: 'FULL' } }),
      this.prisma.movableBox.count({ where: { status: 'INACTIVE' } }),

      // Structure metrics
      this.prisma.room.count(),

      // Capacity utilization (aggregate across all boxes)
      this.prisma.movableBox.aggregate({
        _sum: {
          capacity: true,
          occupiedCount: true,
        },
      }),
    ]);

    // Calculate occupancy metrics
    const totalCapacity = capacityData._sum.capacity || 0;
    const totalOccupied = capacityData._sum.occupiedCount || 0;
    const occupancyRate = totalCapacity > 0 
      ? parseFloat(((totalOccupied / totalCapacity) * 100).toFixed(1))
      : 0;

    // Occupied boxes = boxes with at least one passport (ACTIVE + FULL)
    const occupiedBoxes = activeBoxes + fullBoxes;

    return {
      // Passport metrics
      totalPassports,
      inBox: inBoxPassports,
      issued: issuedPassports,

      // Box metrics
      totalBoxes,
      occupiedBoxes,
      activeBoxes,
      fullBoxes,
      inactiveBoxes,
      vacantBoxes: totalBoxes - occupiedBoxes,

      // Capacity metrics
      totalCapacity,
      totalOccupied,
      totalVacant: totalCapacity - totalOccupied,
      occupancyRate,

      // Structure metrics
      totalRooms,
    };
  }
}
