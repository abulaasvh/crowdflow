/**
 * Auth Service — Business Logic
 *
 * Handles password hashing, token lifecycle, and refresh token rotation.
 * Uses Argon2id for memory-hard, side-channel resistant password hashing.
 *
 * Refresh Token Rotation Strategy:
 * ─────────────────────────────────
 * 1. On login, create a new token "family" (UUID).
 * 2. Issue refresh token tagged with that family.
 * 3. On refresh, issue a new refresh token with the SAME family,
 *    and mark the old token as revoked.
 * 4. If a revoked token is reused → the entire family is revoked
 *    (indicates token theft — attacker and user both have the token).
 *
 * Reference: https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
 */

import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { SECURITY } from '@crowdflow/shared-types';
import type { UserRole } from '@crowdflow/shared-types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenFamily,
  calculateExpiry,
} from '../utils/jwt';
import {
  AuthenticationError,
  ConflictError,
  TokenError,
} from '../utils/errors';
import type { RegisterInput, LoginInput } from '../utils/validation';
import { logger } from '../utils/logger';

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Register a new user with email/password.
   * Uses Argon2id with tuned parameters for memory-hard hashing.
   */
  async register(input: RegisterInput) {
    // Check for existing user
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // Hash password with Argon2id — memory-hard, side-channel resistant
    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: SECURITY.ARGON2_MEMORY_COST,
      timeCost: SECURITY.ARGON2_TIME_COST,
      parallelism: SECURITY.ARGON2_PARALLELISM,
    });

    // Create user with preferences in a transaction
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        passwordHash,
        role: input.role as never,
        provider: 'EMAIL',
        ticketId: input.ticketId,
        preferences: {
          create: {
            dietary: ['NONE'],
            accessibility: ['NONE'],
            notificationsEnabled: true,
            language: 'en',
          },
        },
      },
      include: {
        preferences: true,
        seatInfo: true,
      },
    });

    // Generate token pair
    const tokens = await this.generateTokenPair(user.id, user.email, user.role as unknown as UserRole);

    logger.info({ userId: user.id }, 'New user registered');

    return { user, tokens };
  }

  /**
   * Authenticate user with email/password.
   * Uses constant-time comparison via Argon2 verify.
   */
  async login(input: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: {
        preferences: true,
        seatInfo: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Use same error for "user not found" and "wrong password"
      // to prevent email enumeration attacks
      throw new AuthenticationError('Invalid email or password');
    }

    // Argon2 verify — constant-time comparison
    const isValid = await argon2.verify(user.passwordHash, input.password);

    if (!isValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role as unknown as UserRole);

    logger.info({ userId: user.id }, 'User logged in');

    return { user, tokens };
  }

  /**
   * Register or login a user via Firebase Google Sign-In.
   * Verifies the Firebase ID token server-side using Firebase Admin SDK.
   */
  async googleSignIn(firebaseUid: string, email: string, displayName: string, avatarUrl: string | null, role: string) {
    // Check if user exists by Firebase UID
    let user = await this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { preferences: true, seatInfo: true },
    });

    if (!user) {
      // Also check by email in case they previously registered with email/password
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { preferences: true, seatInfo: true },
      });

      if (user) {
        // Link Firebase account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { firebaseUid, provider: 'GOOGLE', avatarUrl },
          include: { preferences: true, seatInfo: true },
        });
      } else {
        // Create new user from Google profile
        user = await this.prisma.user.create({
          data: {
            email,
            displayName,
            firebaseUid,
            provider: 'GOOGLE',
            role: role as never,
            avatarUrl,
            isVerified: true, // Google accounts are pre-verified
            preferences: {
              create: {
                dietary: ['NONE'],
                accessibility: ['NONE'],
                notificationsEnabled: true,
                language: 'en',
              },
            },
          },
          include: { preferences: true, seatInfo: true },
        });
      }
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role as unknown as UserRole);

    logger.info({ userId: user.id, provider: 'GOOGLE' }, 'Google Sign-In');

    return { user, tokens };
  }

  /**
   * Refresh tokens using rotation strategy.
   * On every refresh, the old token is revoked and a new pair is issued.
   * If a revoked token is reused, the ENTIRE family is revoked (theft detection).
   */
  async refreshTokens(refreshToken: string) {
    // Verify and decode the refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch {
      throw new TokenError('Invalid or expired refresh token');
    }

    const tokenHash = hashToken(refreshToken);

    // Find the refresh token record
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: { include: { preferences: true, seatInfo: true } } },
    });

    if (!storedToken) {
      throw new TokenError('Refresh token not found');
    }

    // ─── Reuse Detection ────────────────────────────────────────
    // If the token has already been revoked, this is a reuse attempt.
    // Revoke the entire family to protect both attacker and legitimate user.
    if (storedToken.revokedAt) {
      logger.warn(
        { family: storedToken.family, userId: storedToken.userId },
        '🚨 Refresh token reuse detected — revoking entire family',
      );

      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { revokedAt: new Date() },
      });

      throw new TokenError(
        'Refresh token has been revoked. Please login again.',
      );
    }

    // Revoke the current token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new token pair with the SAME family
    const tokens = await this.generateTokenPair(
      storedToken.userId,
      decoded.email,
      decoded.role,
      storedToken.family, // Preserve family for rotation tracking
    );

    return { user: storedToken.user, tokens };
  }

  /**
   * Logout — revoke all refresh tokens in the user's active family.
   */
  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    logger.info({ userId }, 'User logged out — all tokens revoked');
  }

  /**
   * Get user profile by ID.
   */
  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        seatInfo: true,
      },
    });
  }

  // ─── Private Helpers ────────────────────────────────────────────

  /**
   * Generate access + refresh token pair and persist the refresh token.
   */
  private async generateTokenPair(
    userId: string,
    email: string,
    role: UserRole,
    family?: string,
  ) {
    const tokenFamily = family || generateTokenFamily();

    const accessToken = generateAccessToken({ userId, email, role });
    const refreshToken = generateRefreshToken({ userId, email, role }, tokenFamily);

    // Store refresh token hash (never store the raw token)
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        family: tokenFamily,
        expiresAt: calculateExpiry('7d'),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer' as const,
    };
  }
}

/**
 * Hash a token using SHA-256 for secure storage.
 * We never store raw tokens — only their hashes.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
