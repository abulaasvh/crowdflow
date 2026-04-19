/**
 * Dashboard Layout — Main application shell
 *
 * Contains sidebar navigation, header with user info,
 * and the main content area with stadium map and metrics.
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { MetricsBar } from './MetricsBar';
import { StadiumMap } from '../StadiumMap/StadiumMap';
import { AlertPanel } from './AlertPanel';
import { ZoneGrid } from './ZoneGrid';
import { OrderQueue } from '../Orders/OrderQueue';
import { ExitPlanner } from '../ExitPlanner/ExitPlanner';
import { ServiceHealth } from './ServiceHealth';

type NavPage = 'overview' | 'zones' | 'orders' | 'alerts' | 'exit-plan' | 'health';

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isConnected, lastUpdate } = useWebSocket();
  const [activePage, setActivePage] = useState<NavPage>('overview');

  const navItems: Array<{ id: NavPage; icon: string; label: string; badge?: number }> = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'zones', icon: '🏟️', label: 'Zone Monitor' },
    { id: 'orders', icon: '🛒', label: 'Order Queue' },
    { id: 'alerts', icon: '🔔', label: 'Alerts', badge: 3 },
    { id: 'exit-plan', icon: '🚪', label: 'Exit Planner' },
    { id: 'health', icon: '⚡', label: 'System Health' },
  ];

  return (
    <div className="dashboard-layout">
      {/* ─── Sidebar ──────────────────────────────────────────── */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" aria-hidden="true">CF</div>
          <span className="sidebar-logo-text text-gradient">CrowdFlow</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Dashboard</span>
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
              id={`nav-${item.id}`}
            >
              <span className="nav-item-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="nav-item-badge" aria-label={`${item.badge} notifications`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <span className="sidebar-section-label" style={{ marginTop: 'auto' }}>System</span>
          <div
            className="nav-item"
            style={{ cursor: 'default' }}
          >
            <span className="nav-item-icon" aria-hidden="true">
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span style={{ fontSize: 'var(--font-xs)' }}>
              {isConnected ? 'Live Connected' : 'Disconnected'}
            </span>
          </div>

          <button
            className="nav-item"
            onClick={logout}
            id="nav-logout"
            style={{ color: 'var(--status-critical)' }}
          >
            <span className="nav-item-icon" aria-hidden="true">🚪</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      {/* ─── Header ───────────────────────────────────────────── */}
      <header className="header" role="banner">
        <div className="header-left">
          <h1 className="header-title" id="page-title">
            {navItems.find((n) => n.id === activePage)?.label || 'Dashboard'}
          </h1>
          <span className="live-indicator" aria-live="polite">
            LIVE
          </span>
        </div>

        <div className="header-right">
          {lastUpdate && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
          <div className="header-user" tabIndex={0} role="button" aria-label="User menu">
            <div className="header-avatar" aria-hidden="true">
              {user?.displayName?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
              {user?.displayName || 'Staff'}
            </span>
          </div>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────────── */}
      <main className="main-content" id="main-content" role="main" aria-labelledby="page-title">
        {activePage === 'overview' && <OverviewPage />}
        {activePage === 'zones' && <ZoneGrid />}
        {activePage === 'orders' && <OrderQueue />}
        {activePage === 'alerts' && <AlertPanel />}
        {activePage === 'exit-plan' && <ExitPlanner />}
        {activePage === 'health' && <ServiceHealth />}
      </main>
    </div>
  );
}

/** Overview page — Main dashboard with map, metrics, and alerts */
function OverviewPage() {
  return (
    <>
      <MetricsBar />
      <div className="dashboard-grid">
        <div>
          <StadiumMap />
        </div>
        <div>
          <div className="section-header">
            <h2 className="section-title">Active Alerts</h2>
          </div>
          <AlertPanel compact />
        </div>
      </div>
    </>
  );
}


