import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller
 * 
 * Provides aggregated statistics for admin dashboard views.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/stats
   * 
   * Returns comprehensive dashboard statistics including:
   * - Passport counts by status
   * - Box counts by status
   * - Capacity utilization
   * - Room count
   * 
   * Accessible by both ADMIN and STAFF roles.
   */
  @Get('stats')
  @Roles('ADMIN', 'STAFF')
  async getStats() {
    return this.dashboardService.getStats();
  }

  /**
   * GET /api/dashboard/activity-trend?days=7
   *
   * Daily counts of movement activity (assigned/returned/issued/moved) for the
   * last `days` days, inclusive of today. `days` is clamped to 1..90.
   * Accessible by both ADMIN and STAFF roles.
   */
  @Get('activity-trend')
  @Roles('ADMIN', 'STAFF')
  async getActivityTrend(@Query('days') days?: string) {
    const parsed = parseInt(days ?? '7', 10);
    const clamped = Math.min(Math.max(Number.isNaN(parsed) ? 7 : parsed, 1), 90);
    return this.dashboardService.getActivityTrend(clamped);
  }

  /**
   * GET /api/dashboard/room-occupancy
   *
   * Per-room capacity/occupied breakdown for the storage overview charts.
   * Accessible by both ADMIN and STAFF roles.
   */
  @Get('room-occupancy')
  @Roles('ADMIN', 'STAFF')
  async getRoomOccupancy() {
    return this.dashboardService.getRoomOccupancy();
  }
}
