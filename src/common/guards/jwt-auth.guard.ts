import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the Bearer JWT on every protected route.
 * Apply globally in AppModule or per-controller/route.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
