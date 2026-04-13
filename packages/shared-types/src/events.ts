/**
 * CrowdFlow WebSocket Event Types
 *
 * Type definitions for all real-time events transmitted via Socket.io.
 * Defines the contract between crowd-service and all connected clients.
 */

import { CrowdDensity, CrowdStats, HeatmapFrame, QueueInfo } from './stadium';
import { Alert } from './notifications';
import { OrderStatusUpdate } from './orders';
import { WSChannel } from './enums';

// ─── Base Event ─────────────────────────────────────────────────

export interface WSEvent<T = unknown> {
  /** Event channel name */
  channel: WSChannel;
  /** Event payload */
  payload: T;
  /** Server timestamp (epoch ms) */
  timestamp: number;
  /** Sequence number for ordering */
  sequence: number;
}

// ─── Event Payloads ─────────────────────────────────────────────

/** Crowd density update for all zones */
export interface CrowdUpdatePayload {
  /** Per-zone density data */
  zones: CrowdDensity[];
  /** Aggregated stats */
  stats: CrowdStats;
  /** Full heatmap frame */
  heatmap: HeatmapFrame;
}

/** Queue wait time update */
export interface QueueUpdatePayload {
  queues: QueueInfo[];
}

/** Zone alert broadcast */
export interface ZoneAlertPayload {
  alert: Alert;
  /** Whether this is a new alert or status update */
  action: 'created' | 'acknowledged' | 'resolved';
}

/** Order status change notification */
export interface OrderStatusPayload {
  update: OrderStatusUpdate;
}

// ─── Client → Server Events ────────────────────────────────────

export interface ClientEvents {
  /** Client subscribes to a specific zone's updates */
  'zone:subscribe': (zoneId: string) => void;
  /** Client unsubscribes from a zone */
  'zone:unsubscribe': (zoneId: string) => void;
  /** Staff acknowledges an alert */
  'alert:acknowledge': (data: { alertId: string; staffId: string }) => void;
  /** Staff updates order status */
  'order:update': (data: OrderStatusUpdate) => void;
  /** Client sends heartbeat */
  'heartbeat': () => void;
}

// ─── Server → Client Events ────────────────────────────────────

export interface ServerEvents {
  /** Broadcast crowd density update */
  'crowd:update': (data: CrowdUpdatePayload) => void;
  /** Broadcast zone alert */
  'zone:alert': (data: ZoneAlertPayload) => void;
  /** Send order status to specific user */
  'order:status': (data: OrderStatusPayload) => void;
  /** Broadcast queue time update */
  'queue:update': (data: QueueUpdatePayload) => void;
  /** Server heartbeat response */
  'heartbeat': (data: { serverTime: number }) => void;
}
