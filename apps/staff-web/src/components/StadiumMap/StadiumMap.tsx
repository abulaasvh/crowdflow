/**
 * Stadium Map — Interactive SVG with Heatmap Overlay
 *
 * Renders a stadium layout as SVG with:
 * - Color-coded zone density overlays
 * - Canvas-based heatmap layer
 * - Hover tooltips with zone stats
 * - Keyboard-accessible zone selection
 * - ARIA labels for screen readers
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import type { CrowdDensity } from '@crowdflow/shared-types';
import { ZoneStatus } from '@crowdflow/shared-types';

// Zone definitions matching the simulation service
const ZONE_SHAPES = [
  { id: 'gate-north', name: 'North Gate', path: 'M180,40 L320,40 L320,80 L180,80 Z', cx: 250, cy: 60 },
  { id: 'gate-south', name: 'South Gate', path: 'M180,520 L320,520 L320,560 L180,560 Z', cx: 250, cy: 540 },
  { id: 'gate-east', name: 'East Gate', path: 'M520,250 L560,250 L560,350 L520,350 Z', cx: 540, cy: 300 },
  { id: 'gate-west', name: 'West Gate', path: 'M40,250 L80,250 L80,350 L40,350 Z', cx: 60, cy: 300 },
  { id: 'section-a', name: 'Section A', path: 'M140,90 L360,90 L380,190 L120,190 Z', cx: 250, cy: 140 },
  { id: 'section-b', name: 'Section B', path: 'M420,150 L510,200 L510,400 L420,450 Z', cx: 465, cy: 300 },
  { id: 'section-c', name: 'Section C', path: 'M90,150 L180,200 L180,400 L90,450 Z', cx: 135, cy: 300 },
  { id: 'section-d', name: 'Section D', path: 'M140,410 L360,410 L380,510 L120,510 Z', cx: 250, cy: 460 },
  { id: 'section-vip', name: 'VIP Lounge', path: 'M200,95 L300,95 L300,130 L200,130 Z', cx: 250, cy: 112 },
  { id: 'concession-n', name: 'N. Food', path: 'M365,95 L410,95 L410,130 L365,130 Z', cx: 387, cy: 112 },
  { id: 'concession-s', name: 'S. Food', path: 'M365,470 L410,470 L410,505 L365,505 Z', cx: 387, cy: 487 },
  { id: 'concession-e', name: 'E. Snack', path: 'M485,220 L515,220 L515,270 L485,270 Z', cx: 500, cy: 245 },
  { id: 'concession-w', name: 'W. Snack', path: 'M85,220 L115,220 L115,270 L85,270 Z', cx: 100, cy: 245 },
  { id: 'restroom-n', name: 'N. Restroom', path: 'M415,95 L450,95 L450,125 L415,125 Z', cx: 432, cy: 110 },
  { id: 'restroom-s', name: 'S. Restroom', path: 'M415,475 L450,475 L450,505 L415,505 Z', cx: 432, cy: 490 },
  { id: 'walkway-north', name: 'N. Concourse', path: 'M90,80 L510,80 L510,95 L90,95 Z', cx: 300, cy: 87 },
  { id: 'walkway-south', name: 'S. Concourse', path: 'M90,505 L510,505 L510,520 L90,520 Z', cx: 300, cy: 512 },
  { id: 'walkway-east', name: 'E. Concourse', path: 'M510,90 L525,90 L525,510 L510,510 Z', cx: 517, cy: 300 },
  { id: 'walkway-west', name: 'W. Concourse', path: 'M75,90 L90,90 L90,510 L75,510 Z', cx: 82, cy: 300 },
  { id: 'medical', name: 'Medical', path: 'M280,280 L320,280 L320,320 L280,320 Z', cx: 300, cy: 300 },
];

function getStatusClass(status: ZoneStatus): string {
  switch (status) {
    case ZoneStatus.LOW: return 'zone-path-low';
    case ZoneStatus.MODERATE: return 'zone-path-moderate';
    case ZoneStatus.HIGH: return 'zone-path-high';
    case ZoneStatus.CRITICAL: return 'zone-path-critical';
    default: return 'zone-path-low';
  }
}


interface TooltipData {
  name: string;
  density: CrowdDensity;
  x: number;
  y: number;
}

export function StadiumMap() {
  const { crowdData, heatmap } = useWebSocket();
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build density lookup map
  const densityMap = new Map<string, CrowdDensity>();
  for (const zone of crowdData) {
    densityMap.set(zone.zoneId, zone);
  }

  // ─── Render Heatmap on Canvas ───────────────────────────────
  const renderHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !heatmap || !showHeatmap) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { gridSize, densities } = heatmap;
    const cellW = canvas.width / gridSize;
    const cellH = canvas.height / gridSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const density = densities[row * gridSize + col] ?? 0;
        if (density < 0.05) continue; // Skip near-zero cells

        // Color mapping: green → yellow → orange → red
        const hue = Math.max(0, 120 - density * 120); // 120=green, 0=red
        const saturation = 80 + density * 20;
        const lightness = 50;
        const alpha = Math.min(0.7, density * 0.8);

        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
        ctx.fillRect(col * cellW, row * cellH, cellW + 0.5, cellH + 0.5);
      }
    }
  }, [heatmap, showHeatmap]);

  useEffect(() => {
    renderHeatmap();
  }, [renderHeatmap]);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        canvas.width = entry.contentRect.width;
        canvas.height = entry.contentRect.height;
        renderHeatmap();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [renderHeatmap]);

  const handleZoneHover = (zoneId: string, zoneName: string, event: React.MouseEvent) => {
    const density = densityMap.get(zoneId);
    if (!density) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      name: zoneName,
      density,
      x: event.clientX - rect.left + 10,
      y: event.clientY - rect.top - 10,
    });
  };

  return (
    <div className="stadium-map-container animate-fade-in" role="img" aria-label="Stadium crowd density map">
      {/* Header */}
      <div className="stadium-map-header">
        <h2 className="stadium-map-title">🏟️ Live Stadium Map</h2>
        <div className="map-controls">
          <button
            className={`btn btn-sm ${showHeatmap ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
            aria-pressed={showHeatmap}
            id="toggle-heatmap"
          >
            {showHeatmap ? '🌡️ Heatmap On' : '🌡️ Heatmap Off'}
          </button>
        </div>
      </div>

      {/* Map Area */}
      <div className="map-canvas-wrapper" ref={containerRef}>
        {/* Heatmap Canvas (behind SVG) */}
        <canvas
          ref={canvasRef}
          className="heatmap-canvas"
          style={{ display: showHeatmap ? 'block' : 'none' }}
          aria-hidden="true"
        />

        {/* SVG Stadium Map */}
        <svg
          className="stadium-svg"
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
          role="group"
          aria-label="Stadium zones"
        >
          {/* Background */}
          <rect x="0" y="0" width="600" height="600" fill="var(--bg-secondary)" rx="12" />

          {/* Playing Field (center) */}
          <ellipse cx="300" cy="300" rx="100" ry="70" className="field-area" />
          <text x="300" y="300" className="field-label">Field</text>

          {/* Render Zones */}
          {ZONE_SHAPES.map((zone) => {
            const density = densityMap.get(zone.id);
            const rate = density ? density.occupancyRate : 0;
            const status = density ? density.status : ZoneStatus.LOW;
            const statusClass = getStatusClass(status as ZoneStatus);

            return (
              <g key={zone.id}>
                <path
                  d={zone.path}
                  className={`zone-path ${statusClass}`}
                  onMouseMove={(e) => handleZoneHover(zone.id, zone.name, e)}
                  onMouseLeave={() => setTooltip(null)}
                  onFocus={() => {}}
                  tabIndex={0}
                  role="button"
                  aria-label={`${zone.name}: ${Math.round(rate * 100)}% occupancy, status ${status}`}
                  id={`zone-${zone.id}`}
                />
                <text x={zone.cx} y={zone.cy} className="zone-label">
                  {zone.name.length > 10 ? zone.name.split(' ')[0] : zone.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="tooltip zone-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            role="tooltip"
          >
            <div className="zone-tooltip-name">{tooltip.name}</div>
            <div className="zone-tooltip-stats">
              <span className="zone-tooltip-label">Occupancy:</span>
              <span className="zone-tooltip-value">
                {Math.round(tooltip.density.occupancyRate * 100)}%
              </span>
              <span className="zone-tooltip-label">Count:</span>
              <span className="zone-tooltip-value">
                {tooltip.density.currentCount.toLocaleString()} / {tooltip.density.capacity.toLocaleString()}
              </span>
              <span className="zone-tooltip-label">Status:</span>
              <span className="zone-tooltip-value">
                <span className={`badge badge-${tooltip.density.status.toLowerCase()}`}>
                  {tooltip.density.status}
                </span>
              </span>
              <span className="zone-tooltip-label">Trend:</span>
              <span className="zone-tooltip-value">
                {tooltip.density.trend > 0 ? '↑ Filling' : tooltip.density.trend < 0 ? '↓ Emptying' : '→ Stable'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend" role="complementary" aria-label="Map legend">
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Density:</span>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--status-low)' }} />
          <span>Low (&lt;30%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--status-moderate)' }} />
          <span>Moderate</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--status-high)' }} />
          <span>High</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ background: 'var(--status-critical)' }} />
          <span>Critical (&gt;85%)</span>
        </div>
      </div>
    </div>
  );
}
