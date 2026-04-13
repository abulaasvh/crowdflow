/**
 * Zone Grid — Per-zone status cards
 *
 * Displays all stadium zones as cards with occupancy bars and status badges.
 * Cards are color-coded by density status.
 */

import { useWebSocket } from '../../context/WebSocketContext';
import { ZoneStatus } from '@crowdflow/shared-types';

function getStatusBadgeClass(status: ZoneStatus | string): string {
  switch (status) {
    case ZoneStatus.LOW: return 'badge-low';
    case ZoneStatus.MODERATE: return 'badge-moderate';
    case ZoneStatus.HIGH: return 'badge-high';
    case ZoneStatus.CRITICAL: return 'badge-critical';
    default: return 'badge-info';
  }
}

function getProgressClass(status: ZoneStatus | string): string {
  switch (status) {
    case ZoneStatus.LOW: return 'progress-low';
    case ZoneStatus.MODERATE: return 'progress-moderate';
    case ZoneStatus.HIGH: return 'progress-high';
    case ZoneStatus.CRITICAL: return 'progress-critical';
    default: return 'progress-low';
  }
}

export function ZoneGrid() {
  const { crowdData } = useWebSocket();

  if (crowdData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <div className="skeleton" style={{ height: 200, marginBottom: 'var(--space-4)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Waiting for crowd data...</p>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">Zone Monitor</h2>
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
          {crowdData.length} zones tracked
        </span>
      </div>

      <div className="zone-grid" role="list" aria-label="Stadium zones">
        {crowdData.map((zone, index) => (
          <div
            key={zone.zoneId}
            className="zone-card glass-card animate-fade-in"
            style={{ animationDelay: `${index * 0.03}s` }}
            role="listitem"
            aria-label={`${zone.zoneId}: ${Math.round(zone.occupancyRate * 100)}% occupied`}
            id={`zone-card-${zone.zoneId}`}
          >
            <div className="zone-card-header">
              <span className="zone-card-name">
                {zone.zoneId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              <span className={`badge ${getStatusBadgeClass(zone.status)}`}>
                {zone.status}
              </span>
            </div>

            {/* Occupancy Bar */}
            <div className="progress-bar" role="progressbar"
              aria-valuenow={Math.round(zone.occupancyRate * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Occupancy: ${Math.round(zone.occupancyRate * 100)}%`}
            >
              <div
                className={`progress-fill ${getProgressClass(zone.status)}`}
                style={{ width: `${Math.min(100, zone.occupancyRate * 100)}%` }}
              />
            </div>

            <div className="zone-card-stats" style={{ marginTop: 'var(--space-3)' }}>
              <div>
                <div className="zone-stat-label">Occupancy</div>
                <div className="zone-stat-value">{Math.round(zone.occupancyRate * 100)}%</div>
              </div>
              <div>
                <div className="zone-stat-label">Count</div>
                <div className="zone-stat-value">{zone.currentCount.toLocaleString()}</div>
              </div>
              <div>
                <div className="zone-stat-label">Capacity</div>
                <div className="zone-stat-value">{zone.capacity.toLocaleString()}</div>
              </div>
              <div>
                <div className="zone-stat-label">Trend</div>
                <div className="zone-stat-value">
                  {zone.trend > 0 ? '↑' : zone.trend < 0 ? '↓' : '→'}
                  <span style={{
                    color: zone.trend > 0 ? 'var(--status-high)' : zone.trend < 0 ? 'var(--status-low)' : 'var(--text-muted)',
                    fontSize: 'var(--font-xs)',
                    marginLeft: 'var(--space-1)',
                  }}>
                    {zone.trend > 0 ? 'Filling' : zone.trend < 0 ? 'Emptying' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
