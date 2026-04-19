/**
 * Order Service — Unit Tests
 *
 * Tests cover: mock menu data, order creation logic,
 * order simulation, and GraphQL schema validation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock Menu Data ──────────────────────────────────────────────
const MOCK_MENU = [
  { id: 'm1', name: 'Stadium Hot Dog', description: 'Classic beef frank', price: 8.50, category: 'FOOD', isAvailable: true },
  { id: 'm2', name: 'Loaded Nachos', description: 'Cheese and jalapeños', price: 12.00, category: 'FOOD', isAvailable: true },
  { id: 'm3', name: 'Craft Beer', description: 'Local IPA', price: 14.00, category: 'DRINK', isAvailable: true },
  { id: 'm4', name: 'Large Cola', description: '32oz Fountain drink', price: 6.50, category: 'DRINK', isAvailable: true },
];

describe('Order Service — Menu Data', () => {
  it('should have all required menu fields', () => {
    for (const item of MOCK_MENU) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('price');
      expect(item).toHaveProperty('category');
      expect(item).toHaveProperty('isAvailable');
    }
  });

  it('should only contain FOOD or DRINK categories', () => {
    const validCategories = ['FOOD', 'DRINK'];
    for (const item of MOCK_MENU) {
      expect(validCategories).toContain(item.category);
    }
  });

  it('should have positive prices', () => {
    for (const item of MOCK_MENU) {
      expect(item.price).toBeGreaterThan(0);
    }
  });

  it('should have all items available by default', () => {
    for (const item of MOCK_MENU) {
      expect(item.isAvailable).toBe(true);
    }
  });

  it('should have unique IDs', () => {
    const ids = MOCK_MENU.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─── Order Creation Logic ────────────────────────────────────────

describe('Order Service — Order Creation', () => {
  function createMockOrder(userId: string, seatInfo: string, items: Array<{ menuItemId: string; quantity: number }>) {
    const totalPrice = items.reduce((sum, item) => {
      const menuItem = MOCK_MENU.find((m) => m.id === item.menuItemId);
      return sum + (menuItem?.price || 0) * item.quantity;
    }, 0);

    return {
      id: crypto.randomUUID(),
      userId,
      seatInfo,
      totalPrice,
      orderNumber: `#CF-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({
        id: crypto.randomUUID(),
        menuItem: MOCK_MENU.find((m) => m.id === i.menuItemId),
        quantity: i.quantity,
      })),
    };
  }

  it('should create an order with correct total price', () => {
    const order = createMockOrder('user-1', 'A-101', [
      { menuItemId: 'm1', quantity: 2 }, // 2 × $8.50 = $17.00
      { menuItemId: 'm4', quantity: 1 }, // 1 × $6.50 = $6.50
    ]);
    expect(order.totalPrice).toBe(23.50);
  });

  it('should generate a valid order number format', () => {
    const order = createMockOrder('user-1', 'B-202', [{ menuItemId: 'm1', quantity: 1 }]);
    expect(order.orderNumber).toMatch(/^#CF-\d{4}$/);
  });

  it('should set status to CONFIRMED on creation', () => {
    const order = createMockOrder('user-1', 'C-303', [{ menuItemId: 'm2', quantity: 1 }]);
    expect(order.status).toBe('CONFIRMED');
  });

  it('should include all ordered items', () => {
    const order = createMockOrder('user-1', 'D-404', [
      { menuItemId: 'm1', quantity: 1 },
      { menuItemId: 'm3', quantity: 2 },
    ]);
    expect(order.items).toHaveLength(2);
  });

  it('should preserve correct quantities', () => {
    const order = createMockOrder('user-1', 'E-505', [
      { menuItemId: 'm2', quantity: 3 },
    ]);
    expect(order.items[0]?.quantity).toBe(3);
  });

  it('should handle unknown menu item gracefully (price = 0)', () => {
    const order = createMockOrder('user-1', 'F-606', [
      { menuItemId: 'unknown-id', quantity: 1 },
    ]);
    expect(order.totalPrice).toBe(0);
  });

  it('should generate unique order IDs', () => {
    const order1 = createMockOrder('user-1', 'A-1', [{ menuItemId: 'm1', quantity: 1 }]);
    const order2 = createMockOrder('user-1', 'A-1', [{ menuItemId: 'm1', quantity: 1 }]);
    expect(order1.id).not.toBe(order2.id);
  });

  it('should include valid ISO timestamp', () => {
    const order = createMockOrder('user-1', 'A-1', [{ menuItemId: 'm1', quantity: 1 }]);
    expect(() => new Date(order.createdAt)).not.toThrow();
    expect(new Date(order.createdAt).toISOString()).toBe(order.createdAt);
  });
});

// ─── Order Status Flow ───────────────────────────────────────────

describe('Order Service — Status Flow', () => {
  const STATUS_FLOW: Record<string, string> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'COMPLETED',
  };

  it('should define valid status transitions', () => {
    expect(STATUS_FLOW['PENDING']).toBe('CONFIRMED');
    expect(STATUS_FLOW['CONFIRMED']).toBe('PREPARING');
    expect(STATUS_FLOW['PREPARING']).toBe('READY');
    expect(STATUS_FLOW['READY']).toBe('COMPLETED');
  });

  it('should not allow transition from COMPLETED', () => {
    expect(STATUS_FLOW['COMPLETED']).toBeUndefined();
  });

  it('should not allow transition from CANCELLED', () => {
    expect(STATUS_FLOW['CANCELLED']).toBeUndefined();
  });
});

// ─── GraphQL Schema Validation ───────────────────────────────────

describe('Order Service — Schema', () => {
  it('should export typeDefs as a string', async () => {
    const { typeDefs } = await import('../src/schema');
    expect(typeof typeDefs).toBe('string');
  });

  it('should define Query type with getMenu', async () => {
    const { typeDefs } = await import('../src/schema');
    expect(typeDefs).toContain('getMenu');
    expect(typeDefs).toContain('getOrders');
    expect(typeDefs).toContain('getOrder');
  });

  it('should define Mutation type with createOrder', async () => {
    const { typeDefs } = await import('../src/schema');
    expect(typeDefs).toContain('createOrder');
    expect(typeDefs).toContain('updateOrderStatus');
  });

  it('should define MenuItem type', async () => {
    const { typeDefs } = await import('../src/schema');
    expect(typeDefs).toContain('type MenuItem');
    expect(typeDefs).toContain('price: Float!');
    expect(typeDefs).toContain('category: String!');
  });

  it('should define CreateOrderInput input type', async () => {
    const { typeDefs } = await import('../src/schema');
    expect(typeDefs).toContain('input CreateOrderInput');
    expect(typeDefs).toContain('userId: String!');
    expect(typeDefs).toContain('items: [OrderItemInput!]!');
  });
});
