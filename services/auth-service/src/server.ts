/**
 * CrowdFlow Auth Service — Fastify Server Bootstrap
 *
 * Configures Fastify with security plugins (Helmet, CORS, rate-limiting),
 * Prisma database connection, GraphQL via Mercurius, and health endpoints.
 *
 * Security measures:
 * - Helmet for HTTP security headers
 * - CORS whitelist from shared constants
 * - Rate limiting (5 requests/minute on auth endpoints)
 * - Request body size limit (1 MB)
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import mercurius from 'mercurius';
import { SECURITY } from '@crowdflow/shared-types';
import { schema } from './schema/typeDefs';
import { resolvers } from './schema/resolvers';
import { prismaPlugin } from './plugins/prisma';
import { authPlugin } from './plugins/auth';
import { logger } from './utils/logger';

const PORT = parseInt(process.env['PORT'] || '4000', 10);
const HOST = process.env['HOST'] || '0.0.0.0';

/**
 * Build and configure the Fastify server instance.
 * Separated from start() for testability — tests can call buildServer()
 * without binding to a port.
 */
export async function buildServer() {
  const app = Fastify({
    logger: true,
    bodyLimit: 1_048_576, // 1 MB — prevent large payload DoS
    trustProxy: true,      // Required for rate-limit behind reverse proxy
  });

  // ─── Security Plugins ──────────────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });

  await app.register(cors, {
    origin: SECURITY.CORS_ORIGINS as unknown as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.register(rateLimit, {
    max: SECURITY.MAX_LOGIN_ATTEMPTS,
    timeWindow: `${SECURITY.LOGIN_WINDOW_MINUTES} minute`,
    keyGenerator: (request) => {
      // Rate limit by IP + route to prevent brute-force
      return `${request.ip}-${request.url}`;
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${context.after}`,
    }),
  });

  // ─── Custom Plugins ────────────────────────────────────────────
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  // ─── GraphQL (Mercurius) ───────────────────────────────────────
  await app.register(mercurius, {
    schema,
    resolvers,
    graphiql: process.env['NODE_ENV'] !== 'production', // Enable GraphiQL in dev
    context: (request) => ({
      prisma: app.prisma,
      user: request.user ?? null,
      request,
    }),
    errorFormatter: (result) => {
      // Sanitize error messages in production — don't leak internals
      const errors = result.errors?.map((err) => ({
        message:
          process.env['NODE_ENV'] === 'production'
            ? 'An error occurred'
            : err.message,
        locations: err.locations,
        path: err.path,
        extensions: {
          code: err.extensions?.['code'] || 'INTERNAL_ERROR',
        },
      }));
      return {
        statusCode: (result as any).statusCode || 500,
        response: { data: result.data || null, errors },
      };
    },
  });

  // ─── Health Check Endpoint ─────────────────────────────────────
  app.get('/health', async (_request, reply) => {
    try {
      // Verify database connectivity
      await app.prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({
        status: 'healthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch {
      return reply.status(503).send({
        status: 'unhealthy',
        service: 'auth-service',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return app;
}

/**
 * Start the server — only called when running directly (not in tests).
 */
async function start() {
  try {
    const app = await buildServer();
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`🔐 Auth service listening on http://${HOST}:${PORT}`);
    app.log.info(`📊 GraphiQL: http://${HOST}:${PORT}/graphiql`);
  } catch (err) {
    logger.error(err, 'Failed to start auth service');
    process.exit(1);
  }
}

start();
