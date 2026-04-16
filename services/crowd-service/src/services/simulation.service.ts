// @ts-nocheck
/**
 * Crowd Simulation Service
 *
 * Generates realistic crowd density data for development and demo.
 * Simulates a full event lifecycle: pre-event arrival → halftime surge → post-event exit.
 *
 * Algorithm:
 * ──────────
 * Each zone has a base density that follows a time-curve modeled as a
 * piecewise function with Gaussian noise for natural variation:
 *
 *   density(t) = baseCurve(t) + noise(σ) + eventImpulse(t)
 *
 * Where:
 * - baseCurve(t) = logistic ramp-up, steady state, then decay
 * - noise(σ) = Gaussian noise with σ proportional to zone type
 * - eventImpulse(t) = spike at halftime for concessions/restrooms
 */

import crypto from 'crypto';
import type { Server } from 'socket.io';
import {
  ZoneType,
  ZoneStatus,
  STADIUM,
  WS_CONFIG,
} from '@crowdflow/shared-types';
import type {
  CrowdDensity,
  CrowdStats,
  HeatmapFrame,
  QueueInfo,
  ServerEvents,
  ClientEvents,
  CrowdUpdatePayload,
} from '@crowdflow/shared-types';
import { generateHeatmapFromZones } from '../algorithms/heatmap';
import { predictQueueWait } from '../algorithms/prediction';
import { logger } from '../utils/logger';

// ─── Stadium Zone Definitions (Mock Data) ────────────────────────

interface SimZone {
  id: string;
  name: string;
  type: ZoneType;
  capacity: number;
  currentOccupancy: number;
  baseRate: number;       // Base fill rate multiplier
  volatility: number;     // Noise amplitude
  pathData: string;       // SVG path for rendering
  center: { x: number; y: number };
  adjacentZones: string[];
  isAccessible: boolean;
  amenities: string[];
}

const ZONE_CONFIGS: Omit<SimZone, 'currentOccupancy'>[] = [
  // Gates
  { id: 'gate-north', name: 'North Gate', type: ZoneType.GATE, capacity: 3000, baseRate: 0.8, volatility: 0.15, pathData: 'M200,50 L300,50 L300,100 L200,100 Z', center: { x: 0.25, y: 0.05 }, adjacentZones: ['section-a', 'walkway-north'], isAccessible: true, amenities: ['Entry', 'Security Check'] },
  { id: 'gate-south', name: 'South Gate', type: ZoneType.GATE, capacity: 3000, baseRate: 0.7, volatility: 0.15, pathData: 'M200,900 L300,900 L300,950 L200,950 Z', center: { x: 0.25, y: 0.95 }, adjacentZones: ['section-d', 'walkway-south'], isAccessible: true, amenities: ['Entry', 'Security Check'] },
  { id: 'gate-east', name: 'East Gate', type: ZoneType.GATE, capacity: 2500, baseRate: 0.6, volatility: 0.12, pathData: 'M900,400 L950,400 L950,500 L900,500 Z', center: { x: 0.95, y: 0.45 }, adjacentZones: ['section-b', 'walkway-east'], isAccessible: true, amenities: ['Entry'] },
  { id: 'gate-west', name: 'West Gate', type: ZoneType.GATE, capacity: 2500, baseRate: 0.65, volatility: 0.12, pathData: 'M50,400 L100,400 L100,500 L50,500 Z', center: { x: 0.05, y: 0.45 }, adjacentZones: ['section-c', 'walkway-west'], isAccessible: true, amenities: ['Entry', 'Accessibility Entrance'] },

  // Seating Sections
  { id: 'section-a', name: 'Section A (North)', type: ZoneType.SEATING, capacity: 8000, baseRate: 0.9, volatility: 0.05, pathData: 'M150,120 L350,120 L380,250 L120,250 Z', center: { x: 0.25, y: 0.18 }, adjacentZones: ['gate-north', 'concession-n', 'walkway-north'], isAccessible: true, amenities: ['Seating'] },
  { id: 'section-b', name: 'Section B (East)', type: ZoneType.SEATING, capacity: 7500, baseRate: 0.85, volatility: 0.05, pathData: 'M700,200 L850,300 L850,600 L700,700 Z', center: { x: 0.78, y: 0.45 }, adjacentZones: ['gate-east', 'concession-e', 'walkway-east'], isAccessible: true, amenities: ['Seating'] },
  { id: 'section-c', name: 'Section C (West)', type: ZoneType.SEATING, capacity: 7500, baseRate: 0.85, volatility: 0.05, pathData: 'M150,200 L300,300 L300,600 L150,700 Z', center: { x: 0.22, y: 0.45 }, adjacentZones: ['gate-west', 'concession-w', 'walkway-west'], isAccessible: true, amenities: ['Seating'] },
  { id: 'section-d', name: 'Section D (South)', type: ZoneType.SEATING, capacity: 8000, baseRate: 0.88, volatility: 0.05, pathData: 'M150,750 L350,750 L380,850 L120,850 Z', center: { x: 0.25, y: 0.82 }, adjacentZones: ['gate-south', 'concession-s', 'walkway-south'], isAccessible: true, amenities: ['Seating'] },
  { id: 'section-vip', name: 'VIP Lounge', type: ZoneType.VIP, capacity: 1500, baseRate: 0.7, volatility: 0.03, pathData: 'M400,150 L600,150 L600,250 L400,250 Z', center: { x: 0.5, y: 0.2 }, adjacentZones: ['walkway-north', 'concession-n'], isAccessible: true, amenities: ['VIP Seating', 'Premium Food', 'Lounge'] },

  // Concessions
  { id: 'concession-n', name: 'North Food Court', type: ZoneType.CONCESSION, capacity: 800, baseRate: 0.5, volatility: 0.25, pathData: 'M380,130 L450,130 L450,180 L380,180 Z', center: { x: 0.42, y: 0.15 }, adjacentZones: ['section-a', 'walkway-north'], isAccessible: true, amenities: ['Food', 'Beverages', 'Snacks'] },
  { id: 'concession-s', name: 'South Food Court', type: ZoneType.CONCESSION, capacity: 800, baseRate: 0.45, volatility: 0.25, pathData: 'M380,800 L450,800 L450,850 L380,850 Z', center: { x: 0.42, y: 0.85 }, adjacentZones: ['section-d', 'walkway-south'], isAccessible: true, amenities: ['Food', 'Beverages'] },
  { id: 'concession-e', name: 'East Snack Bar', type: ZoneType.CONCESSION, capacity: 500, baseRate: 0.4, volatility: 0.2, pathData: 'M820,350 L880,350 L880,420 L820,420 Z', center: { x: 0.85, y: 0.38 }, adjacentZones: ['section-b', 'walkway-east'], isAccessible: false, amenities: ['Snacks', 'Beverages'] },
  { id: 'concession-w', name: 'West Snack Bar', type: ZoneType.CONCESSION, capacity: 500, baseRate: 0.4, volatility: 0.2, pathData: 'M120,350 L180,350 L180,420 L120,420 Z', center: { x: 0.15, y: 0.38 }, adjacentZones: ['section-c', 'walkway-west'], isAccessible: true, amenities: ['Snacks', 'Beverages'] },

  // Restrooms
  { id: 'restroom-n', name: 'North Restrooms', type: ZoneType.RESTROOM, capacity: 300, baseRate: 0.3, volatility: 0.3, pathData: 'M460,130 L510,130 L510,170 L460,170 Z', center: { x: 0.49, y: 0.15 }, adjacentZones: ['walkway-north', 'concession-n'], isAccessible: true, amenities: ['Restroom', 'Accessible Restroom'] },
  { id: 'restroom-s', name: 'South Restrooms', type: ZoneType.RESTROOM, capacity: 300, baseRate: 0.3, volatility: 0.3, pathData: 'M460,810 L510,810 L510,850 L460,850 Z', center: { x: 0.49, y: 0.85 }, adjacentZones: ['walkway-south', 'concession-s'], isAccessible: true, amenities: ['Restroom'] },

  // Walkways
  { id: 'walkway-north', name: 'North Concourse', type: ZoneType.WALKWAY, capacity: 2000, baseRate: 0.4, volatility: 0.15, pathData: 'M130,100 L870,100 L870,130 L130,130 Z', center: { x: 0.5, y: 0.12 }, adjacentZones: ['gate-north', 'section-a', 'concession-n', 'restroom-n'], isAccessible: true, amenities: ['Walkway'] },
  { id: 'walkway-south', name: 'South Concourse', type: ZoneType.WALKWAY, capacity: 2000, baseRate: 0.4, volatility: 0.15, pathData: 'M130,870 L870,870 L870,900 L130,900 Z', center: { x: 0.5, y: 0.88 }, adjacentZones: ['gate-south', 'section-d', 'concession-s', 'restroom-s'], isAccessible: true, amenities: ['Walkway'] },
  { id: 'walkway-east', name: 'East Concourse', type: ZoneType.WALKWAY, capacity: 1500, baseRate: 0.35, volatility: 0.12, pathData: 'M870,130 L900,130 L900,870 L870,870 Z', center: { x: 0.88, y: 0.5 }, adjacentZones: ['gate-east', 'section-b', 'concession-e'], isAccessible: true, amenities: ['Walkway'] },
  { id: 'walkway-west', name: 'West Concourse', type: ZoneType.WALKWAY, capacity: 1500, baseRate: 0.35, volatility: 0.12, pathData: 'M100,130 L130,130 L130,870 L100,870 Z', center: { x: 0.12, y: 0.5 }, adjacentZones: ['gate-west', 'section-c', 'concession-w'], isAccessible: true, amenities: ['Walkway', 'Accessibility Ramp'] },

  // Medical & Emergency
  { id: 'medical', name: 'Medical Station', type: ZoneType.MEDICAL, capacity: 50, baseRate: 0.1, volatility: 0.05, pathData: 'M500,500 L540,500 L540,540 L500,540 Z', center: { x: 0.52, y: 0.52 }, adjacentZones: ['walkway-north', 'walkway-south'], isAccessible: true, amenities: ['First Aid', 'Emergency Services'] },
];

export class CrowdSimulator {
  private zones: SimZone[];
  private sequence: number = 0;
  private broadcastInterval: ReturnType<typeof setInterval> | null = null;
  private simulationTime: number = 0; // minutes since event start
  private readonly tickMinutes: number = 0.5; // each tick = 30 simulated seconds
  private queueHistory: Map<string, number[]> = new Map();
  private previousAlertStates: Map<string, ZoneStatus> = new Map();

  constructor() {
    // Initialize zones with zero occupancy
    this.zones = ZONE_CONFIGS.map((config) => ({
      ...config,
      currentOccupancy: 0,
    }));

    // Initialize queue history for prediction
    for (const z of this.zones) {
      if (z.type === ZoneType.CONCESSION || z.type === ZoneType.RESTROOM) {
        this.queueHistory.set(z.id, []);
      }
    }

    // Warm-start: advance simulation by 35 minutes so demo starts mid-event
    // with realistic occupancy data instead of zeroes
    this.simulationTime = 35;
    for (let i = 0; i < 70; i++) {
      this.tick();
    }
    this.simulationTime = 35;

    logger.info(`Initialized ${this.zones.length} stadium zones (warm-started at t=35m)`);
  }

  /**
   * Start the simulation broadcast loop.
   * Emits crowd updates to all connected Socket.io clients.
   */
  startBroadcast(io: Server<ClientEvents, ServerEvents>) {
    this.broadcastInterval = setInterval(() => {
      this.tick();
      const payload = this.buildUpdatePayload();

      // Broadcast crowd density update to all connected clients
      io.emit('crowd:update', payload);

      // Broadcast queue updates every tick
      const queueData = this.getQueueData();
      io.emit('queue:update', { queues: queueData });

      // Check for alert-worthy changes and broadcast alerts
      this.checkAndEmitAlerts(io);

      this.sequence++;
    }, WS_CONFIG.HEATMAP_BROADCAST_INTERVAL_MS);

    logger.info(
      `Broadcast started: ${WS_CONFIG.HEATMAP_BROADCAST_INTERVAL_MS}ms interval`,
    );
  }

  /** Stop the simulation */
  stop() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }
  }

  /**
   * Advance simulation by one tick.
   * Updates each zone's occupancy based on the time-curve model.
   */
  private tick() {
    this.simulationTime += this.tickMinutes;

    // Wrap simulation time at 180 minutes (3-hour event loop)
    if (this.simulationTime > 180) {
      this.simulationTime = 0;
    }

    for (const zone of this.zones) {
      const targetOccupancy = this.calculateTargetOccupancy(zone);

      // Smooth transition: move 10% toward target each tick (exponential smoothing)
      const alpha = 0.1;
      const noise = (Math.random() - 0.5) * zone.volatility * 2; // Add some jitter
      
      let nextOccupancy = zone.currentOccupancy * (1 - alpha) + targetOccupancy * (1 + noise) * alpha;
      
      // Ensure we don't go below 0 or above capacity
      nextOccupancy = Math.max(0, Math.min(zone.capacity, nextOccupancy));
      
      zone.currentOccupancy = Math.round(nextOccupancy);

      // Clamp to valid range
      zone.currentOccupancy = Math.max(
        0,
        Math.min(zone.capacity, zone.currentOccupancy),
      );

      // Record queue history for prediction
      if (
        zone.type === ZoneType.CONCESSION ||
        zone.type === ZoneType.RESTROOM
      ) {
        const history = this.queueHistory.get(zone.id) || [];
        history.push(zone.currentOccupancy);
        // Keep last 60 readings (30 minutes at 2/min)
        if (history.length > 60) history.shift();
        this.queueHistory.set(zone.id, history);
      }
    }
  }

  /**
   * Calculate target occupancy for a zone based on simulation time.
   *
   * Event timeline (180 min total):
   *   0–30 min:   Arrival phase — logistic ramp-up
   *   30–45 min:  First half — steady state with minor variation
   *   45–60 min:  Halftime — concession/restroom surge
   *   60–75 min:  Second half start — return to seats
   *   75–150 min: Second half — steady state
   *   150–180 min: Exit phase — exponential decay
   */
  private calculateTargetOccupancy(zone: SimZone): number {
    const t = this.simulationTime;
    let baseMultiplier: number;

    if (t < 30) {
      // Arrival: logistic ramp-up → S-curve from 0 to baseRate
      baseMultiplier = zone.baseRate / (1 + Math.exp(-0.3 * (t - 15)));
    } else if (t < 45) {
      // First half: steady state
      baseMultiplier = zone.baseRate * 0.95;
    } else if (t < 60) {
      // Halftime: surge for concessions/restrooms, drop for seating
      if (
        zone.type === ZoneType.CONCESSION ||
        zone.type === ZoneType.RESTROOM
      ) {
        baseMultiplier = Math.min(zone.baseRate * 1.8, 0.95); // surge to 180%
      } else if (zone.type === ZoneType.SEATING || zone.type === ZoneType.VIP) {
        baseMultiplier = zone.baseRate * 0.5; // people leave seats
      } else {
        baseMultiplier = zone.baseRate * 1.3; // walkways fill up
      }
    } else if (t < 75) {
      // Return to seats
      if (zone.type === ZoneType.SEATING || zone.type === ZoneType.VIP) {
        baseMultiplier = zone.baseRate * 0.85;
      } else {
        baseMultiplier = zone.baseRate * 0.6;
      }
    } else if (t < 150) {
      // Second half: steady state
      baseMultiplier = zone.baseRate * 0.9;
    } else {
      // Exit: exponential decay
      const exitProgress = (t - 150) / 30; // 0 to 1 over 30 minutes
      if (zone.type === ZoneType.GATE) {
        baseMultiplier = zone.baseRate * (1 + exitProgress * 0.5); // gates fill up
      } else if (zone.type === ZoneType.SEATING) {
        baseMultiplier = zone.baseRate * Math.exp(-2 * exitProgress); // seats empty
      } else {
        baseMultiplier = zone.baseRate * (1 - exitProgress * 0.7);
      }
    }

    // Add Gaussian noise for natural variation
    const noise = this.gaussianNoise() * zone.volatility * zone.capacity;
    const target = baseMultiplier * zone.capacity + noise;

    return Math.max(0, Math.min(zone.capacity, Math.round(target)));
  }

  /**
   * Box-Muller transform for Gaussian random numbers.
   * Returns a value from N(0, 1) — used for natural crowd variation.
   */
  private gaussianNoise(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /** Build the complete update payload for broadcast */
  private buildUpdatePayload(): CrowdUpdatePayload {
    const zones = this.getCurrentZoneData();
    const stats = this.getStats();
    const heatmap = this.getCurrentHeatmap();

    return { zones, stats, heatmap };
  }

  /** Get current zone density data */
  getCurrentZoneData(): CrowdDensity[] {
    return this.zones.map((zone) => {
      const occupancyRate = zone.currentOccupancy / zone.capacity;
      return {
        zoneId: zone.id,
        currentCount: zone.currentOccupancy,
        capacity: zone.capacity,
        occupancyRate,
        status: this.getZoneStatus(occupancyRate),
        trend: this.calculateTrend(zone.id),
        updatedAt: new Date().toISOString(),
      };
    });
  }

  /** Get current heatmap frame */
  getCurrentHeatmap(): HeatmapFrame {
    const gridSize = STADIUM.HEATMAP_GRID_SIZE;
    const densities = generateHeatmapFromZones(this.zones, gridSize);

    return {
      frameId: crypto.randomUUID(),
      gridSize,
      densities,
      timestamp: new Date().toISOString(),
      sequence: this.sequence,
    };
  }

  /** Get queue data with predictions */
  getQueueData(): QueueInfo[] {
    return this.zones
      .filter(
        (z) =>
          z.type === ZoneType.CONCESSION || z.type === ZoneType.RESTROOM,
      )
      .map((zone) => {
        const history = this.queueHistory.get(zone.id) || [];
        const serviceRate =
          zone.type === ZoneType.CONCESSION ? 2.5 : 5.0; // people per minute
        const currentWait =
          zone.currentOccupancy > 0
            ? zone.currentOccupancy / serviceRate
            : 0;
        const prediction = predictQueueWait(history, serviceRate);

        return {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneType: zone.type,
          currentWaitMinutes: Math.round(currentWait * 10) / 10,
          predictedWaitMinutes: prediction.predicted,
          queueLength: zone.currentOccupancy,
          serviceRate,
          predictionConfidence: prediction.confidence as [number, number],
          updatedAt: new Date().toISOString(),
        };
      });
  }

  /** Get aggregated crowd stats */
  getStats(): CrowdStats {
    const totalAttendees = this.zones
      .filter((z) => z.type === ZoneType.SEATING || z.type === ZoneType.VIP)
      .reduce((sum, z) => sum + z.currentOccupancy, 0);

    const totalCapacity = this.zones
      .filter((z) => z.type === ZoneType.SEATING || z.type === ZoneType.VIP)
      .reduce((sum, z) => sum + z.capacity, 0);

    const zonesAtCapacity = this.zones.filter(
      (z) => z.currentOccupancy / z.capacity > STADIUM.DENSITY_THRESHOLDS.HIGH,
    ).length;

    const queueZones = this.zones.filter(
      (z) =>
        z.type === ZoneType.CONCESSION || z.type === ZoneType.RESTROOM,
    );
    const avgWait =
      queueZones.length > 0
        ? queueZones.reduce((sum, z) => sum + z.currentOccupancy / 3, 0) /
          queueZones.length
        : 0;

    return {
      totalAttendees,
      totalCapacity,
      overallOccupancy: totalCapacity > 0 ? totalAttendees / totalCapacity : 0,
      zonesAtCapacity,
      averageWaitTime: Math.round(avgWait * 10) / 10,
      activeAlerts: zonesAtCapacity, // simplified: each over-capacity zone = 1 alert
    };
  }

  /** Derive ZoneStatus from occupancy rate using threshold constants */
  private getZoneStatus(rate: number): ZoneStatus {
    if (rate >= STADIUM.DENSITY_THRESHOLDS.HIGH) return ZoneStatus.CRITICAL;
    if (rate >= STADIUM.DENSITY_THRESHOLDS.MODERATE) return ZoneStatus.HIGH;
    if (rate >= STADIUM.DENSITY_THRESHOLDS.LOW) return ZoneStatus.MODERATE;
    return ZoneStatus.LOW;
  }

  /** Calculate trend (rate of change) for a zone */
  private calculateTrend(zoneId: string): number {
    const history = this.queueHistory.get(zoneId);
    if (!history || history.length < 2) return 0;
    const recent = history[history.length - 1]!;
    const previous = history[history.length - 2]!;
    return recent - previous;
  }

  /**
   * Check each zone for status transitions and emit alerts when
   * a zone crosses into HIGH or CRITICAL territory.
   */
  private checkAndEmitAlerts(io: Server<ClientEvents, ServerEvents>) {
    for (const zone of this.zones) {
      const rate = zone.currentOccupancy / zone.capacity;
      const currentStatus = this.getZoneStatus(rate);
      const previousStatus = this.previousAlertStates.get(zone.id);

      // Only emit alert when status escalates to HIGH or CRITICAL
      if (
        currentStatus !== previousStatus &&
        (currentStatus === ZoneStatus.HIGH || currentStatus === ZoneStatus.CRITICAL)
      ) {
        const severity = currentStatus === ZoneStatus.CRITICAL ? 'EMERGENCY' : 'WARNING';
        const alertPayload = {
          alert: {
            id: crypto.randomUUID(),
            type: 'CAPACITY' as any,
            severity: severity as any,
            title:
              currentStatus === ZoneStatus.CRITICAL
                ? `🚨 CRITICAL: ${zone.name} Over Capacity`
                : `⚠️ HIGH: ${zone.name} Nearing Capacity`,
            message: `${zone.name} is at ${Math.round(rate * 100)}% capacity (${zone.currentOccupancy.toLocaleString()} / ${zone.capacity.toLocaleString()} people). ${currentStatus === ZoneStatus.CRITICAL ? 'Immediate crowd control action required.' : 'Monitor closely.'}`,
            zoneId: zone.id,
            zoneName: zone.name,
            source: 'SYSTEM' as any,
            acknowledgedBy: null as any,
            acknowledgedAt: null as any,
            isResolved: false,
            resolvedAt: null as any,
            metadata: { occupancyRate: rate, currentCount: zone.currentOccupancy },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          action: 'created' as const,
        };

        io.emit('zone:alert', alertPayload);
        logger.warn({ zone: zone.name, status: currentStatus, rate: Math.round(rate * 100) }, 'Zone alert emitted');
      }

      this.previousAlertStates.set(zone.id, currentStatus);
    }
  }
}
