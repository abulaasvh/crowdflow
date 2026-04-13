/**
 * GraphQL Schema — SDL (Schema Definition Language)
 *
 * Defines the auth service API contract: queries, mutations, and types.
 * Uses Mercurius (Fastify GraphQL) for schema execution.
 */

export const schema = `
  # ─── Enums ──────────────────────────────────────────
  enum UserRole {
    ATTENDEE
    STAFF
    KITCHEN_STAFF
    SECURITY
    ADMIN
  }

  enum AuthProvider {
    EMAIL
    GOOGLE
    APPLE
  }

  enum DietaryPreference {
    NONE
    VEGETARIAN
    VEGAN
    GLUTEN_FREE
    HALAL
    KOSHER
    NUT_FREE
  }

  enum AccessibilityNeed {
    NONE
    WHEELCHAIR
    VISUAL_IMPAIRMENT
    HEARING_IMPAIRMENT
    MOBILITY_AID
  }

  # ─── Types ──────────────────────────────────────────

  type User {
    id: ID!
    email: String!
    displayName: String!
    role: UserRole!
    avatarUrl: String
    provider: AuthProvider!
    isVerified: Boolean!
    ticketId: String
    preferences: UserPreferences
    seatInfo: SeatInfo
    createdAt: String!
    updatedAt: String!
  }

  type UserPreferences {
    dietary: [DietaryPreference!]!
    accessibility: [AccessibilityNeed!]!
    notificationsEnabled: Boolean!
    language: String!
  }

  type SeatInfo {
    section: String!
    row: String!
    seat: Int!
    zoneId: String!
    gateEntry: String!
  }

  type AuthTokens {
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
    tokenType: String!
  }

  type AuthResponse {
    user: User!
    tokens: AuthTokens!
  }

  type LogoutResponse {
    success: Boolean!
    message: String!
  }

  type HealthStatus {
    status: String!
    service: String!
    timestamp: String!
  }

  # ─── Inputs ─────────────────────────────────────────

  input RegisterInput {
    email: String!
    password: String!
    displayName: String!
    role: UserRole
    ticketId: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input GoogleSignInInput {
    firebaseIdToken: String!
    role: UserRole
  }

  input RefreshInput {
    refreshToken: String!
  }

  input UpdateProfileInput {
    displayName: String
    avatarUrl: String
    preferences: UpdatePreferencesInput
  }

  input UpdatePreferencesInput {
    dietary: [DietaryPreference!]
    accessibility: [AccessibilityNeed!]
    notificationsEnabled: Boolean
    language: String
  }

  # ─── Queries ────────────────────────────────────────

  type Query {
    """Get the currently authenticated user's profile"""
    me: User

    """Service health check"""
    health: HealthStatus!
  }

  # ─── Mutations ──────────────────────────────────────

  type Mutation {
    """Register a new user with email and password"""
    register(input: RegisterInput!): AuthResponse!

    """Login with email and password"""
    login(input: LoginInput!): AuthResponse!

    """Sign in with Google via Firebase Auth"""
    googleSignIn(input: GoogleSignInInput!): AuthResponse!

    """Refresh access token using refresh token"""
    refreshToken(input: RefreshInput!): AuthResponse!

    """Logout and revoke all refresh tokens"""
    logout: LogoutResponse!

    """Update user profile (requires authentication)"""
    updateProfile(input: UpdateProfileInput!): User!
  }
`;
