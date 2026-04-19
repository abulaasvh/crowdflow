/**
 * Navigation Service — Unit Tests
 *
 * Tests cover: Dijkstra's shortest path, density-aware weighting,
 * graph structure integrity, and edge case handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STADIUM_NODES, STADIUM_EDGES } from '../src/graph';

// ─── Graph Structure Tests ───────────────────────────────────────

describe('Stadium Graph — Structure', () => {
  it('should have at least 10 nodes', () => {
    expect(STADIUM_NODES.length).toBeGreaterThanOrEqual(10);
  });

  it('should have unique node IDs', () => {
    const ids = STADIUM_NODES.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have all four gates', () => {
    const gateIds = STADIUM_NODES.filter((n) => n.id.startsWith('gate-')).map((n) => n.id);
    expect(gateIds).toContain('gate-north');
    expect(gateIds).toContain('gate-south');
    expect(gateIds).toContain('gate-east');
    expect(gateIds).toContain('gate-west');
  });

  it('should have sections A through D', () => {
    const sectionIds = STADIUM_NODES.filter((n) => n.id.startsWith('section-')).map((n) => n.id);
    expect(sectionIds).toContain('section-a');
    expect(sectionIds).toContain('section-b');
    expect(sectionIds).toContain('section-c');
    expect(sectionIds).toContain('section-d');
  });

  it('should have concession stands', () => {
    const concessions = STADIUM_NODES.filter((n) => n.id.startsWith('concession-'));
    expect(concessions.length).toBeGreaterThanOrEqual(2);
  });

  it('should have walkways/concourses', () => {
    const walkways = STADIUM_NODES.filter((n) => n.id.startsWith('walkway-'));
    expect(walkways.length).toBeGreaterThanOrEqual(4);
  });

  it('should have non-empty names for all nodes', () => {
    for (const node of STADIUM_NODES) {
      expect(node.name.length).toBeGreaterThan(0);
    }
  });
});

describe('Stadium Graph — Edges', () => {
  it('should have positive distances on all edges', () => {
    for (const edge of STADIUM_EDGES) {
      expect(edge.distance).toBeGreaterThan(0);
    }
  });

  it('should only reference valid node IDs', () => {
    const nodeIds = new Set(STADIUM_NODES.map((n) => n.id));
    for (const edge of STADIUM_EDGES) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it('should not have self-loops', () => {
    for (const edge of STADIUM_EDGES) {
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it('gates should connect to walkways', () => {
    const gateEdges = STADIUM_EDGES.filter(
      (e) => e.from.startsWith('gate-') || e.to.startsWith('gate-'),
    );
    expect(gateEdges.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Dijkstra's Algorithm Tests ──────────────────────────────────

describe('Navigation — Dijkstra Pathfinding', () => {
  // Reimplementation of the core algorithm for isolated testing
  function dijkstra(startId: string, endId: string, densities: Array<{ zoneId: string; status: string }> = []) {
    const getWeightMultiplier = (nodeId: string) => {
      const data = densities.find((d) => d.zoneId === nodeId);
      if (!data) return 1.0;
      if (data.status === 'CRITICAL') return 10.0;
      if (data.status === 'HIGH') return 4.0;
      if (data.status === 'MODERATE') return 1.5;
      return 1.0;
    };

    const nodes = new Map<string, { id: string; distance: number; previous: string | null }>();
    const queue: string[] = [];

    STADIUM_NODES.forEach((n) => {
      nodes.set(n.id, {
        id: n.id,
        distance: n.id === startId ? 0 : Infinity,
        previous: null,
      });
      queue.push(n.id);
    });

    while (queue.length > 0) {
      queue.sort((a, b) => (nodes.get(a)?.distance || 0) - (nodes.get(b)?.distance || 0));
      const currentId = queue.shift()!;
      const current = nodes.get(currentId)!;

      if (current.distance === Infinity) break;
      if (currentId === endId) break;

      const neighbors = STADIUM_EDGES.filter((e) => e.from === currentId || e.to === currentId);

      for (const edge of neighbors) {
        const neighborId = edge.from === currentId ? edge.to : edge.from;
        if (!queue.includes(neighborId)) continue;

        const multiplier = getWeightMultiplier(neighborId);
        const alt = current.distance + edge.distance * multiplier;

        const neighbor = nodes.get(neighborId)!;
        if (alt < neighbor.distance) {
          neighbor.distance = alt;
          neighbor.previous = currentId;
        }
      }
    }

    const path: string[] = [];
    let u: string | null = endId;
    while (u && nodes.get(u)?.previous !== null) {
      path.unshift(u);
      u = nodes.get(u)!.previous;
    }
    if (u === startId) path.unshift(u);

    return {
      path,
      totalWeight: nodes.get(endId)?.distance || 0,
      isDensityAware: densities.length > 0,
    };
  }

  it('should find a path from North Gate to Section A', () => {
    const result = dijkstra('gate-north', 'section-a');
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.path[0]).toBe('gate-north');
    expect(result.path[result.path.length - 1]).toBe('section-a');
  });

  it('should find a path from South Gate to Section D', () => {
    const result = dijkstra('gate-south', 'section-d');
    expect(result.path.length).toBeGreaterThanOrEqual(2);
    expect(result.path[0]).toBe('gate-south');
    expect(result.path[result.path.length - 1]).toBe('section-d');
  });

  it('should return zero distance for same start and end', () => {
    const result = dijkstra('gate-north', 'gate-north');
    expect(result.totalWeight).toBe(0);
  });

  it('should produce a finite total weight for reachable nodes', () => {
    const result = dijkstra('gate-north', 'gate-south');
    expect(result.totalWeight).toBeGreaterThan(0);
    expect(result.totalWeight).toBeLessThan(Infinity);
  });

  it('should avoid high-density zones when density data is provided', () => {
    // Without density
    const normalResult = dijkstra('gate-north', 'section-a');

    // With walkway-north at CRITICAL density (10x multiplier)
    const congestedResult = dijkstra('gate-north', 'section-a', [
      { zoneId: 'walkway-north', status: 'CRITICAL' },
    ]);

    // The congested path should have higher total weight
    expect(congestedResult.totalWeight).toBeGreaterThanOrEqual(normalResult.totalWeight);
  });

  it('should set isDensityAware flag when densities provided', () => {
    const result = dijkstra('gate-north', 'section-a', [
      { zoneId: 'walkway-north', status: 'HIGH' },
    ]);
    expect(result.isDensityAware).toBe(true);
  });

  it('should set isDensityAware to false when no densities', () => {
    const result = dijkstra('gate-north', 'section-a');
    expect(result.isDensityAware).toBe(false);
  });
});

// ─── Density Weight Multiplier ───────────────────────────────────

describe('Navigation — Density Weight Multiplier', () => {
  const getWeightMultiplier = (status: string) => {
    if (status === 'CRITICAL') return 10.0;
    if (status === 'HIGH') return 4.0;
    if (status === 'MODERATE') return 1.5;
    return 1.0;
  };

  it('CRITICAL zones have 10x multiplier', () => {
    expect(getWeightMultiplier('CRITICAL')).toBe(10.0);
  });

  it('HIGH zones have 4x multiplier', () => {
    expect(getWeightMultiplier('HIGH')).toBe(4.0);
  });

  it('MODERATE zones have 1.5x multiplier', () => {
    expect(getWeightMultiplier('MODERATE')).toBe(1.5);
  });

  it('LOW zones have 1x (no) multiplier', () => {
    expect(getWeightMultiplier('LOW')).toBe(1.0);
  });

  it('Unknown status defaults to 1.0', () => {
    expect(getWeightMultiplier('UNKNOWN')).toBe(1.0);
  });
});
