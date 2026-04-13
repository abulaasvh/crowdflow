/**
 * Order Queue — Kitchen order management
 *
 * Displays pending orders for kitchen staff with status updates.
 * Mock data for demo — in production, connects to order-service WebSocket.
 */

import { useState, useEffect } from 'react';
import { OrderStatus } from '@crowdflow/shared-types';

interface MockOrder {
  id: string;
  orderNumber: string;
  items: string;
  seatInfo: string;
  status: OrderStatus;
  createdAt: Date;
  estimatedMinutes: number;
}

const MOCK_ORDERS: MockOrder[] = [
  { id: '1', orderNumber: '#CF-1247', items: '2× Hot Dog, 1× Cola', seatInfo: 'Section A, Row 12, Seat 5', status: OrderStatus.PREPARING, createdAt: new Date(Date.now() - 8 * 60000), estimatedMinutes: 4 },
  { id: '2', orderNumber: '#CF-1248', items: '1× Nachos, 2× Beer', seatInfo: 'Section B, Row 3, Seat 18', status: OrderStatus.CONFIRMED, createdAt: new Date(Date.now() - 5 * 60000), estimatedMinutes: 7 },
  { id: '3', orderNumber: '#CF-1249', items: '1× Veggie Burger (GF)', seatInfo: 'VIP Lounge, Table 4', status: OrderStatus.PREPARING, createdAt: new Date(Date.now() - 12 * 60000), estimatedMinutes: 2 },
  { id: '4', orderNumber: '#CF-1250', items: '3× Water, 1× Pretzel', seatInfo: 'Section C, Row 22, Seat 11', status: OrderStatus.READY, createdAt: new Date(Date.now() - 15 * 60000), estimatedMinutes: 0 },
  { id: '5', orderNumber: '#CF-1251', items: '1× Pizza Slice, 1× Lemonade', seatInfo: 'Section D, Row 8, Seat 3', status: OrderStatus.PENDING, createdAt: new Date(Date.now() - 2 * 60000), estimatedMinutes: 10 },
  { id: '6', orderNumber: '#CF-1252', items: '2× Ice Cream', seatInfo: 'Section A, Row 5, Seat 14', status: OrderStatus.CONFIRMED, createdAt: new Date(Date.now() - 3 * 60000), estimatedMinutes: 5 },
];

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'var(--text-muted)';
    case OrderStatus.CONFIRMED: return 'var(--primary-400)';
    case OrderStatus.PREPARING: return 'var(--status-moderate)';
    case OrderStatus.READY: return 'var(--status-low)';
    case OrderStatus.COMPLETED: return 'var(--text-muted)';
    case OrderStatus.CANCELLED: return 'var(--status-critical)';
    default: return 'var(--text-muted)';
  }
}

function getNextStatus(status: OrderStatus): OrderStatus | null {
  const flow: Record<string, OrderStatus> = {
    [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
    [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
    [OrderStatus.PREPARING]: OrderStatus.READY,
    [OrderStatus.READY]: OrderStatus.COMPLETED,
  };
  return flow[status] || null;
}

export function OrderQueue() {
  const [orders, setOrders] = useState<MockOrder[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState<'all' | 'active' | 'ready'>('all');
  const [, setTick] = useState(0);

  // Force re-render every 30s to update timestamps
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const next = getNextStatus(order.status);
        return next ? { ...order, status: next } : order;
      }),
    );
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(order.status);
    if (filter === 'ready') return order.status === OrderStatus.READY;
    return order.status !== OrderStatus.COMPLETED && order.status !== OrderStatus.CANCELLED;
  });

  const timeSince = (date: Date) => {
    const mins = Math.round((Date.now() - date.getTime()) / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  return (
    <>
      <div className="section-header">
        <h2 className="section-title">🛒 Kitchen Order Queue</h2>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {(['all', 'active', 'ready'] as const).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(f)}
              id={`filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="order-queue" role="list" aria-label="Order queue">
        {filteredOrders.length === 0 ? (
          <div className="glass-card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No orders matching filter</p>
          </div>
        ) : (
          filteredOrders.map((order, index) => (
            <div
              key={order.id}
              className="order-card animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
              role="listitem"
              aria-label={`Order ${order.orderNumber}: ${order.status}`}
            >
              <div className="order-number">{order.orderNumber}</div>
              <div className="order-details">
                <div className="order-items-text">{order.items}</div>
                <div className="order-seat">📍 {order.seatInfo}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
                <span
                  className="badge"
                  style={{
                    color: getStatusColor(order.status),
                    background: `${getStatusColor(order.status)}22`,
                  }}
                >
                  {order.status}
                </span>
                <span className="order-time">{timeSince(order.createdAt)}</span>
                {getNextStatus(order.status) && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleUpdateStatus(order.id)}
                    id={`advance-${order.id}`}
                    aria-label={`Move order ${order.orderNumber} to ${getNextStatus(order.status)}`}
                  >
                    → {getNextStatus(order.status)}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
