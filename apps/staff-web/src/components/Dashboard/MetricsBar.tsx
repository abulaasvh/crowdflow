/**
 * Metrics Bar — Top-level KPI cards
 *
 * Displays key crowd stats: total attendance, occupancy rate,
 * zones at capacity, average wait time, and active alerts.
 * Updates in real-time via WebSocket context.
 */

import { useWebSocket } from '../../context/WebSocketContext';

export function MetricsBar() {
  const { stats } = useWebSocket();

  const metrics = [
    {
      id: 'total-attendance',
      label: 'Total Attendance',
      value: stats ? stats.totalAttendees.toLocaleString() : '—',
      subValue: stats ? `/ ${stats.totalCapacity.toLocaleString()}` : '',
      trend: null,
      icon: '👥',
    },
    {
      id: 'occupancy-rate',
      label: 'Occupancy Rate',
      value: stats ? `${Math.round(stats.overallOccupancy * 100)}%` : '—',
      subValue: null,
      trend: stats && stats.overallOccupancy > 0.8 ? 'up' : stats && stats.overallOccupancy < 0.5 ? 'down' : 'neutral',
      icon: '📈',
    },
    {
      id: 'zones-capacity',
      label: 'Zones at Capacity',
      value: stats ? String(stats.zonesAtCapacity) : '0',
      subValue: stats && stats.zonesAtCapacity > 0 ? 'Needs attention' : 'All clear',
      trend: stats && stats.zonesAtCapacity > 0 ? 'up' : 'neutral',
      icon: '⚠️',
    },
    {
      id: 'avg-wait',
      label: 'Avg Wait Time',
      value: stats ? `${stats.averageWaitTime.toFixed(1)}m` : '—',
      subValue: 'across all queues',
      trend: stats && stats.averageWaitTime > 10 ? 'up' : 'neutral',
      icon: '⏱️',
    },
    {
      id: 'active-alerts',
      label: 'Active Alerts',
      value: stats ? String(stats.activeAlerts) : '0',
      subValue: null,
      trend: stats && stats.activeAlerts > 0 ? 'up' : 'neutral',
      icon: '🔔',
    },
  ];

  return (
    <div className="metrics-bar" role="region" aria-label="Key performance metrics">
      {metrics.map((metric) => (
        <div
          key={metric.id}
          className="metric-card glass-card"
          id={`metric-${metric.id}`}
          aria-label={`${metric.label}: ${metric.value}`}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-1)',
          }}>
            <span className="metric-label">{metric.label}</span>
            <span style={{ fontSize: 'var(--font-xl)' }} aria-hidden="true">{metric.icon}</span>
          </div>
          <div className="metric-value">{metric.value}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {metric.trend && (
              <span className={`metric-trend metric-trend-${metric.trend}`}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
              </span>
            )}
            {metric.subValue && (
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {metric.subValue}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
