/**
 * CrowdFlow Auth Types
 *
 * Type definitions for authentication, user profiles, and authorization.
 * Used by auth-service, mobile app, and staff dashboard.
 */

import {
  UserRole,
  AuthProvider,
  DietaryPreference,
  AccessibilityNeed,
} from './enums';

// ─── User ───────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl: string | null;
  provider: AuthProvider;
  firebaseUid: string | null; // Firebase Auth UID for Google Sign-In
  preferences: UserPreferences;
  ticketId: string | null;
  seatInfo: SeatInfo | null;
  isVerified: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface UserPreferences {
  dietary: DietaryPreference[];
  accessibility: AccessibilityNeed[];
  notificationsEnabled: boolean;
  language: string; // ISO 639-1
}

export interface SeatInfo {
  section: string;
  row: string;
  seat: number;
  zoneId: string;
  gateEntry: string;
}

// ─── Auth Requests/Responses ────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  role?: UserRole;
  ticketId?: string;
}

export interface GoogleSignInRequest {
  /** Firebase ID token obtained from client-side Google Sign-In */
  firebaseIdToken: string;
  role?: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expiry
  tokenType: 'Bearer';
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatarUrl?: string;
  preferences?: Partial<UserPreferences>;
}

// ─── JWT Payload ────────────────────────────────────────────────

export interface JWTPayload {
  sub: string;       // User ID
  email: string;
  role: UserRole;
  iat: number;       // Issued at (epoch seconds)
  exp: number;       // Expires at (epoch seconds)
  jti: string;       // Token ID for revocation tracking
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  family: string;     // Token family for rotation detection
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}
