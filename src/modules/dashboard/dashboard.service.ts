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
      occupiedBoxes,
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

      // Occupied boxes (boxes that contain at least one passport)
      this.prisma.movableBox.count({ where: { occupiedCount: { gt: 0 } } }),
    ]);

    // Calculate occupancy metrics
    const totalCapacity = capacityData._sum.capacity || 0;
    const totalOccupied = capacityData._sum.occupiedCount || 0;
    const occupancyRate = totalCapacity > 0 
      ? parseFloat(((totalOccupied / totalCapacity) * 100).toFixed(1))
      : 0;

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

  /**
   * Daily activity trend for the last `days` days (inclusive of today).
   *
   * Returns one entry per day — including days with zero activity — so the
   * client can render a continuous chart. Counts are split by movement action.
   * Uses generate_series as a date spine left-joined onto movement_logs.
   */
  async getActivityTrend(days: number) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        date: string;
        assigned: number;
        returned: number;
        issued: number;
        moved: number;
        total: number;
      }>
    >`
      SELECT
        to_char(d.day, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(CASE WHEN ml.action = 'PASSPORT_ASSIGNED' THEN 1 ELSE 0 END), 0)::int AS assigned,
        COALESCE(SUM(CASE WHEN ml.action = 'PASSPORT_RETURNED' THEN 1 ELSE 0 END), 0)::int AS returned,
        COALESCE(SUM(CASE WHEN ml.action = 'PASSPORT_ISSUED' THEN 1 ELSE 0 END), 0)::int AS issued,
        COALESCE(SUM(CASE WHEN ml.action = 'BOX_MOVED' THEN 1 ELSE 0 END), 0)::int AS moved,
        COUNT(ml.id)::int AS total
      FROM generate_series(
        CURRENT_DATE - make_interval(days => ${days - 1}::int),
        CURRENT_DATE,
        '1 day'::interval
      ) AS d(day)
      LEFT JOIN movement_logs ml ON ml."createdAt"::date = d.day::date
      GROUP BY d.day
      ORDER BY d.day ASC
    `;

    return rows;
  }

  /**
   * Per-room storage occupancy — capacity, occupied count and box count for
   * every room. Powers the "organised storage" breakdown on the dashboard.
   * Rooms with no boxes are still returned (with zeros).
   */
  async getRoomOccupancy() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        roomId: string;
        roomName: string;
        boxes: number;
        capacity: number;
        occupied: number;
      }>
    >`
      SELECT
        ro.id AS "roomId",
        ro.name AS "roomName",
        COUNT(DISTINCT b.id)::int AS boxes,
        COALESCE(SUM(b.capacity), 0)::int AS capacity,
        COALESCE(SUM(b."occupiedCount"), 0)::int AS occupied
      FROM rooms ro
      LEFT JOIN shelves sh ON sh."roomId" = ro.id
      LEFT JOIN rows r ON r."shelfId" = sh.id
      LEFT JOIN slots s ON s."rowId" = r.id
      LEFT JOIN movable_boxes b ON b."slotId" = s.id
      GROUP BY ro.id, ro.name
      ORDER BY ro.name ASC
    `;

    return rows.map((row) => {
      const vacant = row.capacity - row.occupied;
      const occupancyRate =
        row.capacity > 0
          ? parseFloat(((row.occupied / row.capacity) * 100).toFixed(1))
          : 0;
      return { ...row, vacant, occupancyRate };
    });
  }

  /**
   * The given officer's own activity counts for today (since local midnight):
   * passports issued, passports returned, and boxes moved.
   */
  async getMyActivity(userId: string) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [issuedToday, returnsToday, boxMovesToday] = await Promise.all([
      this.prisma.movementLog.count({
        where: {
          userId,
          action: 'PASSPORT_ISSUED',
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.movementLog.count({
        where: {
          userId,
          action: 'PASSPORT_RETURNED',
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.movementLog.count({
        where: {
          userId,
          action: 'BOX_MOVED',
          createdAt: { gte: startOfToday },
        },
      }),
    ]);

    return { issuedToday, returnsToday, boxMovesToday };
  }
}
