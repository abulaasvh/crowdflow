// @ts-nocheck
import axios from 'axios';
import { STADIUM_EDGES, STADIUM_NODES } from './graph';

interface RouteNode {
  id: string;
  distance: number;
  previous: string | null;
}

export async function findOptimalPath(startId: string, endId: string) {
  // 1. Fetch current densities from crowd-service
  let densities: any[] = [];
  try {
    const response = await axios.get(`${process.env.CROWD_SERVICE_URL || 'http://localhost:4001'}/density`);
    densities = response.data;
  } catch (err) {
    console.warn('⚠️ Could not fetch densities, falling back to static distances');
  }

  // Helper to get density factor (1.0 to 10.0)
  const getWeightMultiplier = (nodeId: string) => {
    const data = densities.find((d) => d.zoneId === nodeId);
    if (!data) return 1.0;
    // CRITICAL = 10.0, HIGH = 4.0, MODERATE = 1.5, LOW = 1.0
    if (data.status === 'CRITICAL') return 10.0;
    if (data.status === 'HIGH') return 4.0;
    if (data.status === 'MODERATE') return 1.5;
    return 1.0;
  };

  // 2. Dijkstra's Algorithm
  const nodes: Map<string, RouteNode> = new Map();
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
    // Sort queue by distance
    queue.sort((a, b) => (nodes.get(a)?.distance || 0) - (nodes.get(b)?.distance || 0));
    const currentId = queue.shift()!;
    const current = nodes.get(currentId)!;

    if (current.distance === Infinity) break;
    if (currentId === endId) break;

    // Find neighbors
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

  // 3. Reconstruct Path
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
