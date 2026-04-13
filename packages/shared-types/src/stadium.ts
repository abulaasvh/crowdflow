/**
 * CrowdFlow Stadium Types
 *
 * Type definitions for stadium zones, heatmap data, crowd density,
 * and spatial coordinates. Used by crowd-service, mobile map, and staff dashboard.
 */

import { ZoneType, ZoneStatus } from './enums';

// ─── Spatial Coordinates ────────────────────────────────────────

/** 2D point in the stadium coordinate system (normalized 0-1) */
export interface Point2D {
  x: number;
  y: number;
}

/** Bounding box for a zone or region */
export interface BoundingBox {
  topLeft: Point2D;
  bottomRight: Point2D;
}

/** SVG path data for rendering a zone shape */
export interface ZoneShape {
  /** SVG path data string (d attribute) */
  pathData: string;
  /** Center point for label placement */
  center: Point2D;
  /** Bounding box for hit detection */
  bounds: BoundingBox;
}

// ─── Stadium Map ────────────────────────────────────────────────

export interface StadiumMap {
  id: string;
  name: string;
  venueName: string;
  /** Total venue capacity */
  capacity: number;
  /** SVG viewBox dimensions */
  viewBox: {
    width: number;
    height: number;
  };
  zones: Zone[];
  /** Geolocation for Google Maps integration */
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  shape: ZoneShape;
  capacity: number;
  currentOccupancy: number;
  status: ZoneStatus;
  /** Amenities available in this zone */
  amenities: string[];
  /** Connected zone IDs for navigation graph */
  adjacentZones: string[];
  /** Whether zone is accessible (wheelchair, etc.) */
  isAccessible: boolean;
}

// ─── Heatmap Data ───────────────────────────────────────────────

/**
 * Heatmap cell representing crowd density at a grid position.
 * Values are normalized 0-1 where 0 = empty, 1 = maximum capacity.
 *
 * Grid uses bilinear interpolation for smooth density visualization:
 *   density(x,y) = Σ w_i * d_i  where w_i = 1/dist(x,y, sensor_i)²
 */
export interface HeatmapCell {
  /** Grid row index */
  row: number;
  /** Grid column index */
  col: number;
  /** Normalized density value [0, 1] */
  density: number;
  /** Timestamp of this reading (epoch ms) */
  timestamp: number;
}

/** Complete heatmap frame for a single broadcast cycle */
export interface HeatmapFrame {
  /** Unique frame ID for deduplication */
  frameId: string;
  /** Grid dimensions */
  gridSize: number;
  /** Flattened density array (row-major order) for efficient transfer */
  densities: Float32Array | number[];
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Frame sequence number for ordering */
  sequence: number;
}

// ─── Crowd Density ──────────────────────────────────────────────

export interface CrowdDensity {
  zoneId: string;
  /** Current people count in zone */
  currentCount: number;
  /** Zone capacity */
  capacity: number;
  /** Occupancy ratio [0, 1] */
  occupancyRate: number;
  /** Computed zone status from density thresholds */
  status: ZoneStatus;
  /** Rate of change: positive = filling, negative = emptying */
  trend: number;
  /** Last updated timestamp */
  updatedAt: string;
}

/** Aggregated crowd stats for dashboard KPIs */
export interface CrowdStats {
  totalAttendees: number;
  totalCapacity: number;
  overallOccupancy: number;
  zonesAtCapacity: number;
  averageWaitTime: number;
  activeAlerts: number;
}

// ─── Queue Data ─────────────────────────────────────────────────

export interface QueueInfo {
  zoneId: string;
  zoneName: string;
  zoneType: ZoneType;
  /** Current estimated wait time in minutes */
  currentWaitMinutes: number;
  /** Predicted wait time in 15 minutes */
  predictedWaitMinutes: number;
  /** Number of people currently in queue */
  queueLength: number;
  /** Service rate: people served per minute */
  serviceRate: number;
  /** Confidence interval for prediction [low, high] */
  predictionConfidence: [number, number];
  updatedAt: string;
}
