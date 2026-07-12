import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    movementLog: {
      count: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isActive: true,
        role: 'ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'ADMIN',
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isActive: false,
        role: 'ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('Password123!', 10),
        isActive: true,
        role: 'ADMIN',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const createUserDto = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'Password123!',
        role: 'STAFF' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: createUserDto.email,
        name: createUserDto.name,
        role: createUserDto.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser(createUserDto);

      expect(result.message).toBe('User created successfully');
      expect(result.user.email).toBe(createUserDto.email);
      expect(mockPrismaService.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      const createUserDto = {
        email: 'existing@example.com',
        name: 'Existing User',
        password: 'Password123!',
        role: 'STAFF' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: createUserDto.email,
      });

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateDto = {
        name: 'Updated Name',
        role: 'ADMIN' as const,
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Old Name',
        role: 'STAFF',
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: updateDto.name,
        role: updateDto.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.updateUser('user-1', updateDto);

      expect(result.message).toBe('User updated successfully');
      expect(result.user.name).toBe(updateDto.name);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('nonexistent-id', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when changing to existing email', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({
          id: 'user-1',
          email: 'old@example.com',
        })
        .mockResolvedValueOnce({
          id: 'user-2',
          email: 'existing@example.com',
        });

      await expect(
        service.updateUser('user-1', { email: 'existing@example.com' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('toggleUserStatus', () => {
    it('should toggle user status successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: true,
        role: 'STAFF',
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        isActive: false,
        role: 'STAFF',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.toggleUserStatus('user-1', 'current-user');

      expect(result.message).toBe('User deactivated successfully');
      expect(result.user.isActive).toBe(false);
    });

    it('should throw BadRequestException when trying to deactivate self', async () => {
      await expect(
        service.toggleUserStatus('user-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when deactivating last admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        isActive: true,
        role: 'ADMIN',
      });

      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(
        service.toggleUserStatus('user-1', 'current-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'STAFF',
      });

      mockPrismaService.movementLog.count.mockResolvedValue(0);
      mockPrismaService.user.delete.mockResolvedValue({});

      const result = await service.deleteUser('user-1', 'current-user');

      expect(result.message).toBe('User deleted successfully');
      expect(mockPrismaService.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('should throw BadRequestException when trying to delete self', async () => {
      await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when deleting last admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(
        service.deleteUser('user-1', 'current-user'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when user has movement logs', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'STAFF',
      });

      mockPrismaService.movementLog.count.mockResolvedValue(5);

      await expect(
        service.deleteUser('user-1', 'current-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateRole', () => {
    it('should update user role successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        role: 'STAFF',
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        isActive: true,
      });

      const result = await service.updateRole('user-1', 'ADMIN', 'current-user');

      expect(result.role).toBe('ADMIN');
    });

    it('should throw BadRequestException when changing own role', async () => {
      await expect(
        service.updateRole('user-1', 'STAFF', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when downgrading last admin', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      mockPrismaService.user.count.mockResolvedValue(1);

      await expect(
        service.updateRole('user-1', 'STAFF', 'current-user'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      mockPrismaService.user.count
        .mockResolvedValueOnce(10) // total users
        .mockResolvedValueOnce(8) // active users
        .mockResolvedValueOnce(3) // admin count
        .mockResolvedValueOnce(7); // staff count

      const result = await service.getUserStats();

      expect(result).toEqual({
        totalUsers: 10,
        activeUsers: 8,
        inactiveUsers: 2,
        adminCount: 3,
        staffCount: 7,
      });
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: await bcrypt.hash('OldPassword123!', 10),
      };

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.changePassword('user-1', {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toBe('Password changed successfully');
    });

    it('should throw UnauthorizedException for incorrect current password', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: await bcrypt.hash('OldPassword123!', 10),
      };

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'WrongPassword!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException when new password is same as current', async () => {
      const mockUser = {
        id: 'user-1',
        passwordHash: await bcrypt.hash('SamePassword123!', 10),
      };

      mockPrismaService.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
