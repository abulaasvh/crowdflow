/**
 * Auth Service — Unit Tests
 *
 * Tests cover: JWT generation/verification, password hashing,
 * token rotation, and input validation.
 */

import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTokenFamily,
  calculateExpiry,
} from '../src/utils/jwt';
import {
  registerSchema,
  loginSchema,
} from '../src/utils/validation';
import { UserRole } from '@crowdflow/shared-types';

// ─── JWT Tests ──────────────────────────────────────────────────

describe('JWT Utilities', () => {
  const testUser = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@crowdflow.com',
    role: UserRole.ATTENDEE,
  };

  describe('Access Token', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testUser);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify and decode a valid access token', () => {
      const token = generateAccessToken(testUser);
      const decoded = verifyAccessToken(token);

      expect(decoded.sub).toBe(testUser.userId);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(UserRole.ATTENDEE);
      expect(decoded.jti).toBeDefined();
    });

    it('should reject an invalid access token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should reject a tampered token', () => {
      const token = generateAccessToken(testUser);
      const tampered = token.slice(0, -5) + 'xxxxx';
      expect(() => verifyAccessToken(tampered)).toThrow();
    });

    it('should include unique jti for each token', () => {
      const token1 = generateAccessToken(testUser);
      const token2 = generateAccessToken(testUser);
      const decoded1 = verifyAccessToken(token1);
      const decoded2 = verifyAccessToken(token2);

      expect(decoded1.jti).not.toBe(decoded2.jti);
    });
  });

  describe('Refresh Token', () => {
    it('should generate a valid refresh token with family', () => {
      const family = generateTokenFamily();
      const token = generateRefreshToken(testUser, family);
      const decoded = verifyRefreshToken(token);

      expect(decoded.sub).toBe(testUser.userId);
      expect(decoded.family).toBe(family);
    });

    it('should not verify a refresh token with access secret', () => {
      const family = generateTokenFamily();
      const token = generateRefreshToken(testUser, family);
      expect(() => verifyAccessToken(token)).toThrow();
    });
  });

  describe('Token Family', () => {
    it('should generate unique family UUIDs', () => {
      const family1 = generateTokenFamily();
      const family2 = generateTokenFamily();
      expect(family1).not.toBe(family2);
    });
  });

  describe('calculateExpiry', () => {
    it('should calculate 15m expiry correctly', () => {
      const before = Date.now();
      const expiry = calculateExpiry('15m');
      const after = Date.now();

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 15 * 60_000);
      expect(expiry.getTime()).toBeLessThanOrEqual(after + 15 * 60_000);
    });

    it('should calculate 7d expiry correctly', () => {
      const before = Date.now();
      const expiry = calculateExpiry('7d');

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 7 * 86_400_000);
    });

    it('should throw for invalid duration', () => {
      expect(() => calculateExpiry('invalid')).toThrow();
    });
  });
});

// ─── Validation Tests ───────────────────────────────────────────

describe('Input Validation', () => {
  describe('Register Schema', () => {
    it('should validate a correct registration input', () => {
      const input = {
        email: 'Test@Example.COM',
        password: 'SecureP@ss1',
        displayName: 'John Doe',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com'); // lowercased
        expect(result.data.role).toBe('ATTENDEE'); // default
      }
    });

    it('should reject weak password', () => {
      const input = {
        email: 'test@example.com',
        password: 'weak',
        displayName: 'John Doe',
      };

      const result = registerSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'NoSpecialChar1',
        displayName: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const result = registerSchema.safeParse({
        email: 'not-an-email',
        password: 'SecureP@ss1',
        displayName: 'John Doe',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty display name', () => {
      const result = registerSchema.safeParse({
        email: 'test@example.com',
        password: 'SecureP@ss1',
        displayName: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid role override', () => {
      const result = registerSchema.safeParse({
        email: 'staff@example.com',
        password: 'SecureP@ss1',
        displayName: 'Staff User',
        role: 'STAFF',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe('STAFF');
      }
    });
  });

  describe('Login Schema', () => {
    it('should validate correct login input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });
      expect(result.success).toBe(false);
    });
  });
});
