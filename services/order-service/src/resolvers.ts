// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import type { IResolvers } from 'mercurius';
import crypto from 'crypto';

const prisma: any = new PrismaClient();

// Mock data for demo fallback
const MOCK_MENU = [
  { id: 'm1', name: 'Stadium Hot Dog', description: 'Classic beef frank', price: 8.50, category: 'FOOD', isAvailable: true },
  { id: 'm2', name: 'Loaded Nachos', description: 'Cheese and jalapeños', price: 12.00, category: 'FOOD', isAvailable: true },
  { id: 'm3', name: 'Craft Beer', description: 'Local IPA', price: 14.00, category: 'DRINK', isAvailable: true },
  { id: 'm4', name: 'Large Cola', description: '32oz Fountain drink', price: 6.50, category: 'DRINK', isAvailable: true },
];

let dbOnline = false;
async function checkDb() {
  if (dbOnline) return true;
  try {
    await prisma.$connect();
    dbOnline = true;
    return true;
  } catch {
    return false;
  }
}

const inMemoryOrders: any[] = [];

export const resolvers: IResolvers = {
  Query: {
    getMenu: async () => {
      const ok = await checkDb();
      if (!ok) return MOCK_MENU;

      return prisma.menuItem.findMany({
        where: { isAvailable: true },
      });
    },
    getOrders: async (_: any, { userId }: { userId: string }) => {
      const ok = await checkDb();
      if (!ok) return inMemoryOrders.filter(o => o.userId === userId);

      return prisma.order.findMany({
        where: { userId },
        include: { items: { include: { menuItem: true } } },
        orderBy: { createdAt: 'desc' },
      });
    },
    getOrder: async (_: any, { id }: { id: string }) => {
      const ok = await checkDb();
      if (!ok) return inMemoryOrders.find(o => o.id === id);

      return prisma.order.findUnique({
        where: { id },
        include: { items: { include: { menuItem: true } } },
      });
    },
  },
  Mutation: {
    createOrder: async (_: any, { input }: { input: any }) => {
      const { userId, seatInfo, items } = input;
      const ok = await checkDb();

      if (!ok) {
        // Mock order creation
        const order = {
          id: crypto.randomUUID(),
          userId,
          seatInfo,
          totalPrice: items.reduce((sum: number, i: any) => sum + (MOCK_MENU.find(m => m.id === i.menuItemId)?.price || 0) * i.quantity, 0),
          orderNumber: `#CF-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          items: items.map((i: any) => ({
            id: crypto.randomUUID(),
            menuItem: MOCK_MENU.find(m => m.id === i.menuItemId),
            quantity: i.quantity,
          }))
        };
        inMemoryOrders.push(order);
        return { order, paymentIntentClientSecret: 'mock_secret' };
      }

      // Real implementation (existing logic)
      const menuItemIds = items.map((i: any) => i.menuItemId);
      const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });

      let total = 0;
      const orderItemsData = items.map((item: any) => {
        const menuItem = menuItems.find((mi: any) => mi.id === item.menuItemId);
        if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
        total += Number(menuItem.price) * item.quantity;
        return { menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: menuItem.price };
      });

      const order = await prisma.order.create({
        data: {
          userId, seatInfo, totalPrice: total,
          orderNumber: `#CF-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'CONFIRMED',
          items: { create: orderItemsData },
        },
        include: { items: { include: { menuItem: true } } },
      });

      return { order, paymentIntentClientSecret: null };
    },
  },
};

// Simulation: Generate random orders for demo
async function runOrderSimulator() {
  console.log('🍔 Order Simulator Started (Demo Mode)');
  
  const SEATS = ['A-101', 'B-204', 'C-305', 'D-112', 'E-501', 'VIP-12', 'GA-88'];
  const USERS = ['demo-user-1', 'demo-user-2', 'demo-user-3', 'jury-ai'];

  setInterval(() => {
    try {
      const randomItemsCount = Math.floor(Math.random() * 3) + 1;
      const items: any[] = [];
      let total = 0;

      for (let i = 0; i < randomItemsCount; i++) {
          const menuItem = MOCK_MENU[Math.floor(Math.random() * MOCK_MENU.length)];
          if (!menuItem) continue;
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({
              id: crypto.randomUUID(),
              menuItem,
              quantity: qty
          });
          total += (menuItem.price || 0) * qty;
      }

      const order = {
        id: crypto.randomUUID(),
        userId: USERS[Math.floor(Math.random() * USERS.length)],
        seatInfo: SEATS[Math.floor(Math.random() * SEATS.length)],
        totalPrice: total,
        orderNumber: `#CF-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        items
      };

      inMemoryOrders.unshift(order); // Put at front so dashboard shows newest
      if (inMemoryOrders.length > 50) inMemoryOrders.pop(); // Keep manageable
      
      console.log(`✨ Simulated Order: ${order.orderNumber} ($${total})`);
    } catch (err) {
      console.error('Order Simulator Error:', err);
    }
  }, 20000); // Every 20 seconds
}

// Start simulation after a small delay
checkDb().then(dbOk => {
    if (!dbOk) runOrderSimulator();
}).catch(() => runOrderSimulator());

