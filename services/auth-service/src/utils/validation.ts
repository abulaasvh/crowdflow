/**
 * Input Validation Schemas — Zod
 *
 * Strict input validation for all auth operations.
 * Prevents injection attacks, enforces business rules,
 * and provides typed runtime validation.
 */

import { z } from 'zod';
import { SECURITY } from '@crowdflow/shared-types';

// ─── Email Validation ───────────────────────────────────────────
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be 255 characters or less')
  .transform((val) => val.toLowerCase().trim());

// ─── Password Validation ────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(
    SECURITY.MIN_PASSWORD_LENGTH,
    `Password must be at least ${SECURITY.MIN_PASSWORD_LENGTH} characters`,
  )
  .max(
    SECURITY.MAX_PASSWORD_LENGTH,
    `Password must be at most ${SECURITY.MAX_PASSWORD_LENGTH} characters`,
  )
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character',
  );

// ─── Registration ───────────────────────────────────────────────
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(100, 'Display name must be 100 characters or less')
    .trim(),
  role: z
    .enum(['ATTENDEE', 'STAFF', 'KITCHEN_STAFF', 'SECURITY', 'ADMIN'])
    .optional()
    .default('ATTENDEE'),
  ticketId: z
    .string()
    .max(50, 'Ticket ID must be 50 characters or less')
    .optional(),
});

// ─── Login ──────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// ─── Google Sign-In ─────────────────────────────────────────────
export const googleSignInSchema = z.object({
  firebaseIdToken: z.string().min(1, 'Firebase ID token is required'),
  role: z
    .enum(['ATTENDEE', 'STAFF', 'KITCHEN_STAFF', 'SECURITY', 'ADMIN'])
    .optional()
    .default('ATTENDEE'),
});

// ─── Refresh Token ──────────────────────────────────────────────
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ─── Update Profile ─────────────────────────────────────────────
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  avatarUrl: z
    .string()
    .url('Invalid avatar URL')
    .max(500)
    .optional(),
  preferences: z
    .object({
      dietary: z
        .array(
          z.enum([
            'NONE', 'VEGETARIAN', 'VEGAN', 'GLUTEN_FREE',
            'HALAL', 'KOSHER', 'NUT_FREE',
          ]),
        )
        .optional(),
      accessibility: z
        .array(
          z.enum([
            'NONE', 'WHEELCHAIR', 'VISUAL_IMPAIRMENT',
            'HEARING_IMPAIRMENT', 'MOBILITY_AID',
          ]),
        )
        .optional(),
      notificationsEnabled: z.boolean().optional(),
      language: z.string().length(2).optional(),
    })
    .optional(),
});

// ─── Type Exports ───────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleSignInInput = z.infer<typeof googleSignInSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
