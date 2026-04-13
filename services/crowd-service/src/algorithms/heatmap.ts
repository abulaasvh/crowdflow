/**
 * Heatmap Generation Algorithm
 *
 * Converts discrete zone occupancy data into a continuous 2D density grid
 * using Inverse Distance Weighting (IDW) interpolation.
 *
 * Algorithm: IDW (Shepard's Method)
 * ──────────────────────────────────
 * For each grid cell (i, j), density is computed as:
 *
 *   d(i,j) = Σ(w_k * d_k) / Σ(w_k)
 *
 * Where:
 *   w_k = 1 / dist((i,j), zone_k.center)^p
 *   d_k = zone_k.occupancyRate
 *   p = 2 (inverse square distance weighting)
 *
 * The power parameter p=2 gives smooth, natural-looking density gradients.
 * Higher values would make the heatmap more "spiky" around zone centers.
 *
 * Performance: O(gridSize² × numZones) — optimized for 50×50 grid with ~20 zones.
 */

interface ZoneInput {
  center: { x: number; y: number };
  currentOccupancy: number;
  capacity: number;
}

/**
 * Generate a 2D heatmap grid from zone occupancy data.
 *
 * @param zones - Array of zones with center coordinates and occupancy
 * @param gridSize - Number of cells per axis (total cells = gridSize²)
 * @returns Flattened density array in row-major order, values [0, 1]
 */
export function generateHeatmapFromZones(
  zones: ZoneInput[],
  gridSize: number,
): number[] {
  const densities = new Array<number>(gridSize * gridSize);
  const power = 2; // IDW power parameter
  const epsilon = 0.0001; // Prevent division by zero

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Normalize grid position to [0, 1]
      const x = col / (gridSize - 1);
      const y = row / (gridSize - 1);

      let weightedSum = 0;
      let weightSum = 0;

      for (const zone of zones) {
        // Euclidean distance from grid cell to zone center
        const dx = x - zone.center.x;
        const dy = y - zone.center.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + epsilon;

        // Inverse distance weight
        const weight = 1 / Math.pow(dist, power);

        // Zone's occupancy rate as density value
        const zoneDensity =
          zone.capacity > 0 ? zone.currentOccupancy / zone.capacity : 0;

        weightedSum += weight * zoneDensity;
        weightSum += weight;
      }

      // Normalize and clamp to [0, 1]
      const density = weightSum > 0 ? weightedSum / weightSum : 0;
      densities[row * gridSize + col] = Math.min(1, Math.max(0, density));
    }
  }

  return densities;
}

/**
 * Apply Gaussian blur to a heatmap for smoother visualization.
 * Uses a 3×3 kernel with σ=1.
 *
 * @param densities - Flat density array (row-major)
 * @param gridSize - Grid dimension
 * @returns Blurred density array
 */
export function gaussianBlurHeatmap(
  densities: number[],
  gridSize: number,
): number[] {
  // 3×3 Gaussian kernel (σ=1, normalized)
  const kernel = [
    1 / 16, 2 / 16, 1 / 16,
    2 / 16, 4 / 16, 2 / 16,
    1 / 16, 2 / 16, 1 / 16,
  ];

  const result = new Array<number>(densities.length);

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      let sum = 0;
      let ki = 0;

      for (let kr = -1; kr <= 1; kr++) {
        for (let kc = -1; kc <= 1; kc++) {
          const r = Math.min(gridSize - 1, Math.max(0, row + kr));
          const c = Math.min(gridSize - 1, Math.max(0, col + kc));
          sum += (densities[r * gridSize + c] ?? 0) * (kernel[ki] ?? 0);
          ki++;
        }
      }

      result[row * gridSize + col] = sum;
    }
  }

  return result;
}

/**
 * Detect anomalous density spikes using Z-score.
 * Returns zone IDs where density is > 2 standard deviations above mean.
 *
 * @param zones - Current zone data
 * @returns Array of zone IDs with anomalous density
 */
export function detectAnomalies(
  zones: Array<{ id: string; currentOccupancy: number; capacity: number }>,
): string[] {
  const rates = zones.map((z) =>
    z.capacity > 0 ? z.currentOccupancy / z.capacity : 0,
  );

  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance =
    rates.reduce((sum, r) => sum + (r - mean) ** 2, 0) / rates.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: string[] = [];
  const threshold = 2; // Z-score threshold

  for (let i = 0; i < zones.length; i++) {
    const zScore = stdDev > 0 ? ((rates[i] ?? 0) - mean) / stdDev : 0;
    if (zScore > threshold) {
      anomalies.push(zones[i]!.id);
    }
  }

  return anomalies;
}
