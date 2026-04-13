/**
 * CrowdFlow Notification Types
 *
 * Type definitions for push notifications (FCM), in-app alerts,
 * and staff incident management.
 */

import { AlertSeverity, AlertType } from './enums';

// ─── Push Notifications ─────────────────────────────────────────

export interface PushNotification {
  id: string;
  /** Firebase Cloud Messaging token target */
  fcmToken?: string;
  /** Topic for broadcast (e.g., 'zone-A1', 'all-attendees') */
  topic?: string;
  title: string;
  body: string;
  /** Data payload for client-side handling */
  data: Record<string, string>;
  /** Notification priority */
  priority: 'high' | 'normal';
  /** Time-to-live in seconds */
  ttlSeconds: number;
  /** Whether notification was delivered */
  delivered: boolean;
  sentAt: string;
}

export interface NotificationPreferences {
  userId: string;
  /** Receive crowd surge warnings */
  crowdAlerts: boolean;
  /** Receive order status updates */
  orderUpdates: boolean;
  /** Receive optimal exit time suggestions */
  exitSuggestions: boolean;
  /** Receive general event announcements */
  eventAnnouncements: boolean;
  /** Quiet hours — suppress non-critical */
  quietMode: boolean;
}

// ─── Staff Alerts ───────────────────────────────────────────────

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  /** Zone where alert originated */
  zoneId: string;
  zoneName: string;
  /** Auto-generated or manually created */
  source: 'SYSTEM' | 'STAFF';
  /** Staff member who acknowledged */
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  /** Whether alert is resolved */
  isResolved: boolean;
  resolvedAt: string | null;
  /** Alert metadata (density readings, incident details, etc.) */
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertRequest {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  zoneId: string;
  metadata?: Record<string, unknown>;
}

export interface AcknowledgeAlertRequest {
  alertId: string;
  staffId: string;
  notes?: string;
}
