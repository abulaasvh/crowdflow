/**
 * Crowd Service — Unit Tests
 *
 * Tests for heatmap generation, prediction algorithm, and anomaly detection.
 */

import { describe, it, expect } from 'vitest';
import {
  generateHeatmapFromZones,
  gaussianBlurHeatmap,
  detectAnomalies,
} from '../src/algorithms/heatmap';
import { predictQueueWait, simpleMovingAverage } from '../src/algorithms/prediction';

describe('Heatmap Generation (IDW Interpolation)', () => {
  const mockZones = [
    { center: { x: 0.2, y: 0.2 }, currentOccupancy: 800, capacity: 1000 },
    { center: { x: 0.8, y: 0.8 }, currentOccupancy: 200, capacity: 1000 },
    { center: { x: 0.5, y: 0.5 }, currentOccupancy: 500, capacity: 1000 },
  ];

  it('should generate a grid of correct size', () => {
    const grid = generateHeatmapFromZones(mockZones, 10);
    expect(grid).toHaveLength(100); // 10 × 10
  });

  it('should produce values in [0, 1] range', () => {
    const grid = generateHeatmapFromZones(mockZones, 20);
    for (const val of grid) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    }
  });

  it('should have higher density near high-occupancy zones', () => {
    const grid = generateHeatmapFromZones(mockZones, 10);
    // Cell near zone at (0.2, 0.2) with 80% occupancy
    const nearHigh = grid[2 * 10 + 2]!; // row=2, col=2 → (0.22, 0.22)
    // Cell near zone at (0.8, 0.8) with 20% occupancy
    const nearLow = grid[8 * 10 + 8]!;  // row=8, col=8 → (0.88, 0.88)
    expect(nearHigh).toBeGreaterThan(nearLow);
  });

  it('should handle empty zones', () => {
    const grid = generateHeatmapFromZones([], 5);
    expect(grid).toHaveLength(25);
    grid.forEach((v) => expect(v).toBe(0));
  });
});

describe('Gaussian Blur', () => {
  it('should smooth the heatmap values', () => {
    // Create a grid with a single spike
    const gridSize = 5;
    const grid = new Array(25).fill(0);
    grid[12] = 1.0; // Center spike

    const blurred = gaussianBlurHeatmap(grid, gridSize);
    // Center should be reduced, neighbors should gain value
    expect(blurred[12]).toBeLessThan(1.0);
    expect(blurred[12]).toBeGreaterThan(0);
    // Adjacent cells should have nonzero values
    expect(blurred[7]).toBeGreaterThan(0);  // above
    expect(blurred[11]).toBeGreaterThan(0); // left
  });
});

describe('Anomaly Detection', () => {
  it('should detect zones with density > 2σ above mean', () => {
    const zones = [
      { id: 'a', currentOccupancy: 50, capacity: 100 },
      { id: 'b', currentOccupancy: 48, capacity: 100 },
      { id: 'c', currentOccupancy: 52, capacity: 100 },
      { id: 'e', currentOccupancy: 51, capacity: 100 },
      { id: 'f', currentOccupancy: 49, capacity: 100 },
      { id: 'd', currentOccupancy: 99, capacity: 100 }, // anomaly
    ];

    const anomalies = detectAnomalies(zones);
    expect(anomalies).toContain('d');
    expect(anomalies).not.toContain('a');
  });

  it('should return empty for uniform data', () => {
    const zones = [
      { id: 'a', currentOccupancy: 50, capacity: 100 },
      { id: 'b', currentOccupancy: 50, capacity: 100 },
      { id: 'c', currentOccupancy: 50, capacity: 100 },
    ];
    expect(detectAnomalies(zones)).toHaveLength(0);
  });
});

describe('Queue Prediction (Holt\'s Exponential Smoothing)', () => {
  it('should predict increasing trend', () => {
    const history = [10, 15, 20, 25, 30, 35, 40];
    const result = predictQueueWait(history, 3);
    expect(result.predicted).toBeGreaterThan(40 / 3);
  });

  it('should return confidence interval', () => {
    const history = [10, 12, 14, 16, 18, 20];
    const result = predictQueueWait(history, 2);
    expect(result.confidence[0]).toBeLessThanOrEqual(result.predicted);
    expect(result.confidence[1]).toBeGreaterThanOrEqual(result.predicted);
  });

  it('should handle sparse data gracefully', () => {
    const result = predictQueueWait([5], 2);
    expect(result.predicted).toBe(2.5);
  });

  it('should handle empty history', () => {
    const result = predictQueueWait([], 2);
    expect(result.predicted).toBe(0);
  });
});

describe('Simple Moving Average', () => {
  it('should compute correct average', () => {
    expect(simpleMovingAverage([10, 20, 30], 3)).toBe(20);
  });

  it('should use last N values', () => {
    expect(simpleMovingAverage([1, 2, 3, 4, 5], 3)).toBe(4);
  });

  it('should handle empty array', () => {
    expect(simpleMovingAverage([], 3)).toBe(0);
  });
});
