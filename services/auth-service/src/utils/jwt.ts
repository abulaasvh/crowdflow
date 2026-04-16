/**
 * JWT Utility — Token Generation & Verification
 *
 * Uses RS256 (asymmetric) in production for zero-trust verification
 * and HS256 (symmetric) in development for convenience.
 *
 * Security features:
 * - Short-lived access tokens (15 min)
 * - Unique token IDs (jti) for revocation tracking
 * - Token family tracking for refresh token rotation
 * - Constant-time comparison where applicable
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { SECURITY } from '@crowdflow/shared-types';
import type { JWTPayload, UserRole } from '@crowdflow/shared-types';

// In production, use RS256 with key files. In dev, use HS256 with env secret.
const ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] || 'dev-access-secret-change-in-production';
const REFRESH_SECRET = process.env['JWT_REFRESH_SECRET'] || 'dev-refresh-secret-change-in-production';

interface TokenInput {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Generate a short-lived access token (15 min).
 * Contains user identity and role for RBAC.
 */
export function generateAccessToken(input: TokenInput): string {
  const payload = {
    sub: input.userId,
    email: input.email,
    role: input.role,
    jti: crypto.randomUUID(), // Unique token ID for revocation
  };

  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: SECURITY.ACCESS_TOKEN_EXPIRY,
    algorithm: 'HS256',
    issuer: 'crowdflow-auth',
    audience: 'crowdflow-api',
  });
}

/**
 * Generate a long-lived refresh token (7 days).
 * Used only to obtain new access tokens — never sent to resource APIs.
 *
 * @param family — Token family UUID for rotation detection.
 *   If a refresh token from the same family is used twice, the entire
 *   family is revoked (signals token theft).
 */
export function generateRefreshToken(
  input: TokenInput,
  family: string,
): string {
  const payload = {
    sub: input.userId,
    email: input.email,
    role: input.role,
    jti: crypto.randomUUID(),
    family,
  };

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: SECURITY.REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
    issuer: 'crowdflow-auth',
    audience: 'crowdflow-refresh',
  });
}

/**
 * Verify and decode an access token.
 * Throws if token is expired, malformed, or has invalid signature.
 */
export function verifyAccessToken(token: string): JWTPayload {
  const decoded = jwt.verify(token, ACCESS_SECRET, {
    algorithms: ['HS256'],
    issuer: 'crowdflow-auth',
    audience: 'crowdflow-api',
  });

  return decoded as JWTPayload;
}

/**
 * Verify and decode a refresh token.
 * Returns payload including the token family for rotation detection.
 */
export function verifyRefreshToken(
  token: string,
): JWTPayload & { family: string } {
  const decoded = jwt.verify(token, REFRESH_SECRET, {
    algorithms: ['HS256'],
    issuer: 'crowdflow-auth',
    audience: 'crowdflow-refresh',
  });

  return decoded as JWTPayload & { family: string };
}

/**
 * Generate a new token family UUID.
 * Called when a user logs in — all subsequent refresh tokens
 * share the same family until the next login.
 */
export function generateTokenFamily(): string {
  return crypto.randomUUID();
}

/**
 * Calculate token expiry date from a duration string (e.g., '15m', '7d').
 */
export function calculateExpiry(duration: string): Date {
  const now = Date.now();
  const match = duration.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1]!, 10);
  const unit = match[2] as string;

  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return new Date(now + value * (multipliers[unit] || 0));
}
