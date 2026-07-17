import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return { accessToken: this.jwt.sign(payload) };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // passwordHash is never returned
      },
    });
    return user;
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            movementLogs: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get user statistics for dashboard
   */
  async getUserStats() {
    const [totalUsers, activeUsers, adminCount, staffCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'STAFF' } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      adminCount,
      staffCount,
    };
  }

  /**
   * Create a new user (Admin only)
   */
  async createUser(dto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User created successfully',
      user,
    };
  }

  /**
   * Update user details (Admin only)
   */
  async updateUser(userId: string, dto: UpdateUserDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being changed, check for conflicts
    if (dto.email && dto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'User updated successfully',
      user,
    };
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleUserStatus(userId: string, currentUserId: string) {
    // Prevent users from deactivating themselves
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot deactivate your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if this is the last active admin
    if (user.role === 'ADMIN' && user.isActive) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (activeAdminCount <= 1) {
        throw new BadRequestException('Cannot deactivate the last active admin');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    };
  }

  /**
   * Delete a user (Admin only)
   * Prevents deletion of last admin or self
   */
  async deleteUser(userId: string, currentUserId: string) {
    // Prevent users from deleting themselves
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if this is the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin account');
      }
    }

    // Check if user has movement logs
    const movementLogCount = await this.prisma.movementLog.count({
      where: { userId },
    });

    if (movementLogCount > 0) {
      throw new BadRequestException(
        `Cannot delete user with ${movementLogCount} movement log entries. Consider deactivating instead.`,
      );
    }

    // Delete user
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'User deleted successfully',
    };
  }

  async updateRole(userId: string, role: 'ADMIN' | 'STAFF', currentUserId: string) {
    // Prevent users from changing their own role
    if (userId === currentUserId) {
      throw new BadRequestException('Cannot modify your own role');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If downgrading from ADMIN to STAFF, check if this is the last admin
    if (user.role === 'ADMIN' && role === 'STAFF') {
      const adminCount = await this.prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('Cannot change role of the last admin');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });
  }

  /**
   * Check if initial setup is needed (no users exist in database)
   */
  async checkSetupNeeded(): Promise<{ setupNeeded: boolean; userCount: number }> {
    const userCount = await this.prisma.user.count();
    return {
      setupNeeded: userCount === 0,
      userCount,
    };
  }

  /**
   * Create the first admin user during initial setup
   * Only works when no users exist
   */
  async setupAdmin(dto: SetupAdminDto) {
    // Ensure setup is still needed
    const { setupNeeded } = await this.checkSetupNeeded();
    if (!setupNeeded) {
      throw new ForbiddenException('Setup already completed. Users already exist.');
    }

    // Check if email already exists (redundant but safe)
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Create admin user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      message: 'Initial admin user created successfully',
      user,
    };
  }

  /**
   * Change user password
   * Requires current password verification
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    // Get user with password hash
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Ensure new password is different
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ConflictException('New password must be different from current password');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(dto.newPassword, salt);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  private resetOtps = new Map<string, { code: string; expiresAt: Date }>();

  private async sendOtpEmail(email: string, code: string) {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? 'noreply@passport-track.com';

    // If SMTP credentials are not set up, fall back to console logging
    if (!user || !pass) {
      console.warn(
        `[MAILER] SMTP credentials not fully configured (SMTP_USER/SMTP_PASS are empty). ` +
        `Falling back to console-only OTP delivery.`,
      );
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"PSM Support" <${from}>`,
        to: email,
        subject: 'Password Recovery Verification Code',
        text: `Your verification code is: ${code}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Password Recovery OTP</h2>
            <p>You requested a verification code to reset your password. Use the verification code below to complete the recovery process:</p>
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 700; letter-spacing: 0.1em; color: #0f172a;">${code}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This verification code is valid for 10 minutes. If you did not make this request, you can safely ignore this email.</p>
          </div>
        `,
      });
      console.log(`[MAILER] Successfully sent verification email to ${email}`);
    } catch (error) {
      console.error(`[MAILER] Failed to send verification email to ${email}:`, error);
    }
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    // Generate 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    this.resetOtps.set(email, { code, expiresAt });
    console.log(`[PASSWORD RESET OTP] Email: ${email} | Code: ${code} | Expires: ${expiresAt.toISOString()}`);

    // Send the email (runs asynchronously, does not block client response)
    this.sendOtpEmail(email, code);

    return {
      message: 'Password reset OTP generated successfully.',
    };
  }

  async resetPassword(dto: any) {
    const record = this.resetOtps.get(dto.email);

    if (!record) {
      throw new BadRequestException('No password reset requested for this email');
    }

    if (new Date() > record.expiresAt) {
      this.resetOtps.delete(dto.email);
      throw new BadRequestException('OTP code has expired');
    }

    if (record.code !== dto.otp) {
      throw new BadRequestException('Invalid OTP code');
    }

    this.resetOtps.delete(dto.email);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    return {
      message: 'Password reset successfully',
    };
  }
}
