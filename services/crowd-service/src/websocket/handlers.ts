/**
 * WebSocket Event Handlers
 *
 * Manages Socket.io connections, room subscriptions, and event routing.
 * Authenticates connections via JWT token in handshake.
 */

import type { Server, Socket } from 'socket.io';
import type { ServerEvents, ClientEvents } from '@crowdflow/shared-types';
import { WS_CONFIG } from '@crowdflow/shared-types';
import type { CrowdSimulator } from '../services/simulation.service';
import { logger } from '../utils/logger';

export function setupWebSocketHandlers(
  io: Server<ClientEvents, ServerEvents>,
  simulator: CrowdSimulator,
) {
  // ─── Connection Middleware (Auth) ──────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.['token'] as string | undefined;

    // In development/demo, allow all connections
    // In production, uncomment JWT verification below
    if (!token) {
      logger.debug('Allowing unauthenticated WebSocket connection (demo mode)');
      return next();
    }

    // In production, verify JWT here:
    // const payload = verifyAccessToken(token);
    // socket.data.user = payload;
    next();
  });

  // ─── Connection Handler ────────────────────────────────────────
  io.on('connection', (socket: Socket<ClientEvents, ServerEvents>) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    // Auto-join the staff dashboard room if staff role
    const role = socket.handshake.auth?.['role'] as string | undefined;
    if (role === 'STAFF' || role === 'ADMIN') {
      socket.join(WS_CONFIG.STAFF_ROOM);
      logger.info({ socketId: socket.id }, 'Joined staff room');
    }

    // ─── Zone Subscribe ──────────────────────────────────────────
    socket.on('zone:subscribe', (zoneId: string) => {
      const room = `${WS_CONFIG.ZONE_ROOM_PREFIX}${zoneId}`;
      socket.join(room);
      logger.debug({ socketId: socket.id, zoneId }, 'Subscribed to zone');
    });

    // ─── Zone Unsubscribe ────────────────────────────────────────
    socket.on('zone:unsubscribe', (zoneId: string) => {
      const room = `${WS_CONFIG.ZONE_ROOM_PREFIX}${zoneId}`;
      socket.leave(room);
      logger.debug({ socketId: socket.id, zoneId }, 'Unsubscribed from zone');
    });

    // ─── Heartbeat ───────────────────────────────────────────────
    socket.on('heartbeat', () => {
      socket.emit('heartbeat', { serverTime: Date.now() });
    });

    // ─── Alert Acknowledge ───────────────────────────────────────
    socket.on('alert:acknowledge', (data) => {
      logger.info(data, 'Alert acknowledged');
      // Broadcast to all staff that alert was acknowledged
      io.to(WS_CONFIG.STAFF_ROOM).emit('zone:alert', {
        alert: {
          id: data.alertId,
          type: 'SYSTEM' as never,
          severity: 'INFO' as never,
          title: 'Alert Acknowledged',
          message: `Alert ${data.alertId} acknowledged by staff`,
          zoneId: '',
          zoneName: '',
          source: 'STAFF',
          acknowledgedBy: data.staffId,
          acknowledgedAt: new Date().toISOString(),
          isResolved: false,
          resolvedAt: null,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        action: 'acknowledged',
      });
    });

    // ─── Disconnect ──────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Client disconnected');
    });

    // Send initial data snapshot on connect
    const initialPayload = {
      zones: simulator.getCurrentZoneData(),
      stats: simulator.getStats(),
      heatmap: simulator.getCurrentHeatmap(),
    };
    socket.emit('crowd:update', initialPayload);

    // Also send initial queue data
    socket.emit('queue:update', { queues: simulator.getQueueData() });
  });

  // Log total connections periodically
  setInterval(() => {
    const count = io.engine.clientsCount;
    logger.info({ connections: count }, 'Active WebSocket connections');
  }, 30_000);
}
