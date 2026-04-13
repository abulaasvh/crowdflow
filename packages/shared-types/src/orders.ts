/**
 * CrowdFlow Order Types
 *
 * Type definitions for mobile ordering, menu items, cart, payments.
 * Used by order-service, mobile app, and staff kitchen dashboard.
 */

import { OrderStatus, PaymentStatus, DietaryPreference } from './enums';

// ─── Menu ───────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number; // in cents (Stripe convention for precision)
  currency: string; // ISO 4217 (e.g., 'usd')
  category: MenuCategory;
  imageUrl: string;
  dietaryTags: DietaryPreference[];
  isAvailable: boolean;
  preparationTimeMinutes: number;
  /** Concession zone serving this item */
  zoneId: string;
}

export type MenuCategory =
  | 'FOOD'
  | 'BEVERAGE'
  | 'SNACK'
  | 'DESSERT'
  | 'ALCOHOL'
  | 'COMBO';

// ─── Cart ───────────────────────────────────────────────────────

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  zoneId: string; // Concession zone for pickup
}

// ─── Order ──────────────────────────────────────────────────────

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  status: OrderStatus;
  payment: PaymentInfo;
  /** Delivery details — seat or pickup point */
  delivery: DeliveryInfo;
  /** Estimated time to ready in minutes */
  estimatedReadyMinutes: number;
  /** Staff member handling the order */
  assignedStaffId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string;
}

export interface PaymentInfo {
  status: PaymentStatus;
  /** Stripe Payment Intent ID */
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  method: 'card' | 'google_pay' | 'apple_pay';
}

export interface DeliveryInfo {
  type: 'PICKUP' | 'SEAT_DELIVERY';
  /** Zone ID where order will be ready */
  pickupZoneId: string;
  /** If seat delivery, the seat info */
  seatSection?: string;
  seatRow?: string;
  seatNumber?: number;
}

// ─── Order Events ───────────────────────────────────────────────

export interface OrderCreateRequest {
  items: Array<{
    menuItemId: string;
    quantity: number;
    specialInstructions?: string;
  }>;
  deliveryType: 'PICKUP' | 'SEAT_DELIVERY';
  paymentMethodId: string; // Stripe payment method ID
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  updatedBy: string;
  timestamp: string;
}
