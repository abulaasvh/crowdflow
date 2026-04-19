/**
 * Notification Service — Unit Tests
 *
 * Tests cover: notification schema validation, payload construction,
 * and mock notification dispatch logic.
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// ─── Schema Definition (mirroring server.ts) ─────────────────────

const SendNotificationSchema = z.object({
  token: z.string().optional(),
  topic: z.string().optional(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(),
});

// ─── Schema Validation Tests ─────────────────────────────────────

describe('Notification Service — Schema Validation', () => {
  it('should accept valid notification with token', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'device-token-123',
      title: 'Crowd Alert',
      body: 'Section A is at 90% capacity',
    });
    expect(result.success).toBe(true);
  });

  it('should accept valid notification with topic', () => {
    const result = SendNotificationSchema.safeParse({
      topic: 'zone-section-a',
      title: 'Gate Opening',
      body: 'North Gate is now open',
    });
    expect(result.success).toBe(true);
  });

  it('should accept notification with optional data payload', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'device-token-456',
      title: 'Order Ready',
      body: 'Your order #CF-1234 is ready for pickup',
      data: { orderId: 'ord-123', zone: 'concession-n' },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.data).toEqual({ orderId: 'ord-123', zone: 'concession-n' });
    }
  });

  it('should reject notification without title', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'device-token-123',
      body: 'Missing title',
    });
    expect(result.success).toBe(false);
  });

  it('should reject notification without body', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'device-token-123',
      title: 'Missing Body',
    });
    expect(result.success).toBe(false);
  });

  it('should accept notification with both token and topic', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'device-token-789',
      topic: 'emergency',
      title: 'Emergency Alert',
      body: 'Please evacuate Section B',
    });
    expect(result.success).toBe(true);
  });

  it('should accept notification with empty data object', () => {
    const result = SendNotificationSchema.safeParse({
      token: 'tok-1',
      title: 'Test',
      body: 'Test body',
      data: {},
    });
    expect(result.success).toBe(true);
  });
});

// ─── Notification Message Construction ───────────────────────────

describe('Notification Service — Message Construction', () => {
  function buildMessage(input: z.infer<typeof SendNotificationSchema>) {
    const message: Record<string, unknown> = {
      notification: { title: input.title, body: input.body },
      data: input.data || {},
    };

    if (input.token) message.token = input.token;
    else if (input.topic) message.topic = input.topic;

    return message;
  }

  it('should build message with token target', () => {
    const msg = buildMessage({
      token: 'tok-abc',
      title: 'Hello',
      body: 'World',
    });
    expect(msg.token).toBe('tok-abc');
    expect(msg.topic).toBeUndefined();
  });

  it('should build message with topic target', () => {
    const msg = buildMessage({
      topic: 'alerts',
      title: 'Alert',
      body: 'Critical alert',
    });
    expect(msg.topic).toBe('alerts');
    expect(msg.token).toBeUndefined();
  });

  it('should prefer token over topic when both provided', () => {
    const msg = buildMessage({
      token: 'tok-priority',
      topic: 'fallback-topic',
      title: 'Priority',
      body: 'This goes to token',
    });
    expect(msg.token).toBe('tok-priority');
    // Topic should not be set because token takes priority
    expect(msg.topic).toBeUndefined();
  });

  it('should include notification title and body', () => {
    const msg = buildMessage({
      token: 'tok-1',
      title: 'Test Title',
      body: 'Test Body',
    });
    expect(msg.notification).toEqual({ title: 'Test Title', body: 'Test Body' });
  });

  it('should include custom data payload', () => {
    const msg = buildMessage({
      token: 'tok-1',
      title: 'Order',
      body: 'Ready',
      data: { orderId: '123', action: 'pickup' },
    });
    expect(msg.data).toEqual({ orderId: '123', action: 'pickup' });
  });

  it('should default data to empty object', () => {
    const msg = buildMessage({
      token: 'tok-1',
      title: 'Simple',
      body: 'No data',
    });
    expect(msg.data).toEqual({});
  });
});

// ─── Notification Target Validation ──────────────────────────────

describe('Notification Service — Target Validation', () => {
  function validateTarget(input: { token?: string; topic?: string }): { valid: boolean; error?: string } {
    if (!input.token && !input.topic) {
      return { valid: false, error: 'Either token or topic is required' };
    }
    return { valid: true };
  }

  it('should accept token-only target', () => {
    expect(validateTarget({ token: 'tok-1' })).toEqual({ valid: true });
  });

  it('should accept topic-only target', () => {
    expect(validateTarget({ topic: 'alerts' })).toEqual({ valid: true });
  });

  it('should accept both token and topic', () => {
    expect(validateTarget({ token: 'tok-1', topic: 'alerts' })).toEqual({ valid: true });
  });

  it('should reject when neither token nor topic provided', () => {
    const result = validateTarget({});
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Either token or topic is required');
  });
});
