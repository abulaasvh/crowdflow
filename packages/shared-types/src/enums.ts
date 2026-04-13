/**
 * CrowdFlow Shared Enums
 *
 * Central enum definitions used across all services and apps.
 * Using const enums for zero-runtime overhead in compiled output.
 */

/** User roles for RBAC (Role-Based Access Control) */
export enum UserRole {
  ATTENDEE = 'ATTENDEE',
  STAFF = 'STAFF',
  KITCHEN_STAFF = 'KITCHEN_STAFF',
  SECURITY = 'SECURITY',
  ADMIN = 'ADMIN',
}

/** Authentication providers supported */
export enum AuthProvider {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE', // Firebase Auth — Google Sign-In
  APPLE = 'APPLE',
}

/** Stadium zone types for spatial classification */
export enum ZoneType {
  SEATING = 'SEATING',
  CONCESSION = 'CONCESSION',
  RESTROOM = 'RESTROOM',
  GATE = 'GATE',
  WALKWAY = 'WALKWAY',
  VIP = 'VIP',
  EMERGENCY_EXIT = 'EMERGENCY_EXIT',
  MEDICAL = 'MEDICAL',
  PARKING = 'PARKING',
}

/** Zone congestion status derived from crowd density thresholds */
export enum ZoneStatus {
  LOW = 'LOW',         // < 30% capacity — green
  MODERATE = 'MODERATE', // 30-60% capacity — yellow
  HIGH = 'HIGH',       // 60-85% capacity — orange
  CRITICAL = 'CRITICAL', // > 85% capacity — red
}

/** Mobile order lifecycle states */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERING = 'DELIVERING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Payment processing states */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

/** Alert severity levels for staff dashboard */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
  EMERGENCY = 'EMERGENCY',
}

/** Alert categories for classification */
export enum AlertType {
  CROWD_SURGE = 'CROWD_SURGE',
  MEDICAL = 'MEDICAL',
  SECURITY = 'SECURITY',
  WEATHER = 'WEATHER',
  CAPACITY = 'CAPACITY',
  SYSTEM = 'SYSTEM',
  ORDER_ISSUE = 'ORDER_ISSUE',
}

/** WebSocket event channel names */
export enum WSChannel {
  CROWD_UPDATE = 'crowd:update',
  ZONE_ALERT = 'zone:alert',
  ORDER_STATUS = 'order:status',
  QUEUE_UPDATE = 'queue:update',
  NAVIGATION = 'navigation:update',
  NOTIFICATION = 'notification:push',
  HEARTBEAT = 'heartbeat',
}

/** Dietary preferences for food ordering */
export enum DietaryPreference {
  NONE = 'NONE',
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  HALAL = 'HALAL',
  KOSHER = 'KOSHER',
  NUT_FREE = 'NUT_FREE',
}

/** Accessibility needs for user preferences */
export enum AccessibilityNeed {
  NONE = 'NONE',
  WHEELCHAIR = 'WHEELCHAIR',
  VISUAL_IMPAIRMENT = 'VISUAL_IMPAIRMENT',
  HEARING_IMPAIRMENT = 'HEARING_IMPAIRMENT',
  MOBILITY_AID = 'MOBILITY_AID',
}
