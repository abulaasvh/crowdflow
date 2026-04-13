/**
 * Alert Panel — Real-time incident alerts
 *
 * Displays crowd surge warnings, security incidents, and system alerts.
 * Supports alert acknowledgment via WebSocket.
 * ARIA live region for screen reader announcements.
 */

import { useMemo } from 'react';
import { useWebSocket } from '../../context/WebSocketContext';
import { ZoneStatus } from '@crowdflow/shared-types';

interface AlertPanelProps {
  compact?: boolean;
}

interface GeneratedAlert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  zone: string;
  time: string;
}

export function AlertPanel({ compact = false }: AlertPanelProps) {
  const { crowdData, acknowledgeAlert } = useWebSocket();

  // Generate alerts from crowd data
  const alerts = useMemo<GeneratedAlert[]>(() => {
    const generated: GeneratedAlert[] = [];

    for (const zone of crowdData) {
      if (zone.status === ZoneStatus.CRITICAL) {
        generated.push({
          id: `alert-${zone.zoneId}-critical`,
          title: 'Crowd Capacity Alert',
          message: `${zone.zoneId.replace(/-/g, ' ')} is at ${Math.round(zone.occupancyRate * 100)}% capacity (${zone.currentCount.toLocaleString()} people)`,
          severity: 'emergency',
          zone: zone.zoneId,
          time: new Date().toLocaleTimeString(),
        });
      } else if (zone.status === ZoneStatus.HIGH) {
        generated.push({
          id: `alert-${zone.zoneId}-high`,
          title: 'High Density Warning',
          message: `${zone.zoneId.replace(/-/g, ' ')} approaching capacity at ${Math.round(zone.occupancyRate * 100)}%`,
          severity: 'warning',
          zone: zone.zoneId,
          time: new Date().toLocaleTimeString(),
        });
      }
    }

    // Sort by severity
    const severityOrder = { emergency: 0, critical: 1, warning: 2, info: 3 };
    generated.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return compact ? generated.slice(0, 5) : generated;
  }, [crowdData, compact]);

  if (alerts.length === 0) {
    return (
      <div className="glass-card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>✅</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
          All zones operating normally. No active alerts.
        </p>
      </div>
    );
  }

  return (
    <div
      className="alert-panel"
      role="log"
      aria-label="Alert feed"
      aria-live="polite"
    >
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className="alert-item"
          style={{ animationDelay: `${index * 0.05}s` }}
          role="alert"
        >
          <div className={`alert-severity-indicator alert-severity-${alert.severity}`} />
          <div className="alert-content">
            <div className="alert-title">{alert.title}</div>
            <div className="alert-message">{alert.message}</div>
            <div className="alert-meta">
              <span>🕐 {alert.time}</span>
              <span>📍 {alert.zone.replace(/-/g, ' ')}</span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => acknowledgeAlert(alert.id)}
            aria-label={`Acknowledge alert: ${alert.title}`}
            id={`ack-${alert.id}`}
          >
            ✓ Ack
          </button>
        </div>
      ))}

      {/* Screen reader announcement for new alerts */}
      <div className="sr-only" aria-live="assertive" role="status">
        {alerts.length} active alerts
      </div>
    </div>
  );
}
