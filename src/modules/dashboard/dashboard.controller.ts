import { Controller, Get, UseGuards } from '@nestjs/common';
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
}
