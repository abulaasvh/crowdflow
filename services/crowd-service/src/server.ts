/**
 * CrowdFlow Crowd Service — Server Bootstrap
 *
 * Real-time crowd intelligence engine with Socket.io for live heatmap
 * updates and density simulation. Designed for < 500ms latency at scale.
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { SECURITY, WS_CONFIG } from '@crowdflow/shared-types';
import type { ServerEvents, ClientEvents } from '@crowdflow/shared-types';
import { CrowdSimulator } from './services/simulation.service';
import { setupWebSocketHandlers } from './websocket/handlers';
import { logger } from './utils/logger';

const PORT = parseInt(process.env['CROWD_SERVICE_PORT'] || '4001', 10);
const WS_PORT = parseInt(process.env['WEBSOCKET_PORT'] || '4002', 10);

async function start() {
  // ─── Fastify HTTP Server (REST endpoints) ──────────────────────
  const app = Fastify({ loggerInstance: logger });

  await app.register(cors, {
    origin: SECURITY.CORS_ORIGINS as unknown as string[],
    credentials: true,
  });

  // Health check
  app.get('/health', async () => ({
    status: 'healthy',
    service: 'crowd-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // REST endpoint for current crowd data snapshot
  app.get('/api/crowd/zones', async () => {
    return { zones: simulator.getCurrentZoneData() };
  });

  app.get('/api/crowd/heatmap', async () => {
    return { heatmap: simulator.getCurrentHeatmap() };
  });

  app.get('/api/crowd/queues', async () => {
    return { queues: simulator.getQueueData() };
  });

  app.get('/api/crowd/stats', async () => {
    return { stats: simulator.getStats() };
  });

  // ─── Socket.io WebSocket Server ────────────────────────────────
  const httpServer = createServer();
  const io = new Server<ClientEvents, ServerEvents>(httpServer, {
    cors: {
      origin: SECURITY.CORS_ORIGINS as unknown as string[],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: WS_CONFIG.HEARTBEAT_INTERVAL_MS,
    maxHttpBufferSize: WS_CONFIG.MAX_PAYLOAD_BYTES,
    transports: ['websocket', 'polling'],
  });

  // Initialize the crowd simulator with mock data
  const simulator = new CrowdSimulator();

  // Setup WebSocket event handlers
  setupWebSocketHandlers(io, simulator);

  // Start simulation broadcast loop
  simulator.startBroadcast(io);

  // ─── Start Servers ─────────────────────────────────────────────
  await app.listen({ port: PORT, host: '0.0.0.0' });
  app.log.info(`📊 Crowd REST API on http://0.0.0.0:${PORT}`);

  httpServer.listen(WS_PORT, () => {
    logger.info(`🔌 WebSocket server on ws://0.0.0.0:${WS_PORT}`);
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down...`);
    simulator.stop();
    io.close();
    await app.close();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  logger.error(err, 'Failed to start crowd service');
  process.exit(1);
});
