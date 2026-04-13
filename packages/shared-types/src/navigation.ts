/**
 * CrowdFlow Navigation Types
 *
 * Type definitions for indoor navigation, BLE beacon positioning,
 * and exit planning. Used by navigation-service and mobile app.
 */

import { Point2D } from './stadium';

// ─── BLE Beacons ────────────────────────────────────────────────

export interface BLEBeacon {
  id: string;
  /** Beacon UUID for identification */
  uuid: string;
  major: number;
  minor: number;
  /** Position in stadium coordinate system */
  position: Point2D;
  /** Zone this beacon is located in */
  zoneId: string;
  /** Signal strength at 1 meter (dBm) */
  txPower: number;
  /** Whether beacon is currently active */
  isActive: boolean;
}

/** RSSI reading from a detected beacon */
export interface BeaconReading {
  beaconId: string;
  /** Received Signal Strength Indicator (dBm) */
  rssi: number;
  /** Estimated distance in meters */
  estimatedDistance: number;
  timestamp: number;
}

// ─── Navigation ─────────────────────────────────────────────────

export interface NavigationRequest {
  /** Current position (from BLE trilateration or manual zone selection) */
  from: Point2D | string; // Point2D or zone ID
  /** Destination (zone ID or specific point) */
  to: string;
  /** Whether to avoid crowded zones */
  avoidCrowds: boolean;
  /** Accessibility requirements affect route selection */
  requireAccessible: boolean;
}

export interface NavigationRoute {
  id: string;
  steps: NavigationStep[];
  /** Total estimated walk time in seconds */
  totalTimeSeconds: number;
  /** Total distance in meters */
  totalDistanceMeters: number;
  /** Route avoids zones exceeding this density threshold */
  crowdAvoidanceThreshold: number;
  /** Polyline points for map rendering */
  polyline: Point2D[];
}

export interface NavigationStep {
  /** Step sequence number */
  order: number;
  /** Human-readable instruction */
  instruction: string;
  /** Direction icon identifier */
  direction: 'straight' | 'left' | 'right' | 'up' | 'down' | 'arrive';
  /** Distance for this step in meters */
  distanceMeters: number;
  /** Estimated time for this step in seconds */
  timeSeconds: number;
  /** Zone ID this step passes through */
  zoneId: string;
  /** Waypoint for map rendering */
  waypoint: Point2D;
}

// ─── Exit Planning ──────────────────────────────────────────────

export interface ExitPlan {
  /** Recommended gate for exit */
  recommendedGate: GateRecommendation;
  /** Alternative gates sorted by wait time */
  alternatives: GateRecommendation[];
  /** Transport connections near recommended gate */
  transport: TransportConnection[];
  /** Google Maps directions URL for outdoor navigation */
  googleMapsUrl: string;
}

export interface GateRecommendation {
  gateId: string;
  gateName: string;
  /** Current density at gate zone */
  currentDensity: number;
  /** Estimated wait to exit in minutes */
  estimatedWaitMinutes: number;
  /** Optimal exit time (earliest time with low congestion) */
  optimalExitTime: string; // ISO 8601
  /** Distance from user's seat in meters */
  distanceFromSeat: number;
}

export interface TransportConnection {
  type: 'bus' | 'train' | 'metro' | 'taxi' | 'rideshare' | 'parking';
  name: string;
  /** Distance from gate in meters */
  distanceMeters: number;
  /** Next departure or availability */
  nextAvailable: string;
  /** Google Maps Place ID for deep linking */
  googlePlaceId?: string;
}
