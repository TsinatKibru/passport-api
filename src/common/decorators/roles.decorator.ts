import { SetMetadata } from '@nestjs/common';

export type UserRole = 'ADMIN' | 'STAFF';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to specific roles.
 * Usage: @Roles('ADMIN') or @Roles('ADMIN', 'STAFF')
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
