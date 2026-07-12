import { Body, Controller, Get, Post, UseGuards, Param, Put } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('users')
  getUsers() {
    return this.authService.getUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('users/:id/role')
  updateRole(
    @Param('id') id: string,
    @Body('role') role: 'ADMIN' | 'STAFF',
  ) {
    return this.authService.updateRole(id, role);
  }

  // Setup endpoints (no authentication required for initial setup)
  
  /**
   * GET /api/auth/setup/check
   * Check if initial setup is needed
   */
  @Get('setup/check')
  checkSetup() {
    return this.authService.checkSetupNeeded();
  }

  /**
   * POST /api/auth/setup/admin
   * Create initial admin user (only works when no users exist)
   */
  @Post('setup/admin')
  setupAdmin(@Body() dto: SetupAdminDto) {
    return this.authService.setupAdmin(dto);
  }

  /**
   * PUT /api/auth/change-password
   * Change current user's password
   */
  @UseGuards(JwtAuthGuard)
  @Put('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.sub, dto);
  }
}
