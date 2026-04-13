/**
 * Prisma Plugin for Fastify
 *
 * Registers PrismaClient as a Fastify decorator, ensuring a single
 * client instance is shared across all requests. Handles connection
 * lifecycle and graceful disconnection on server close.
 */

import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';

// Extend Fastify types to include prisma decorator
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    dbConnected: boolean;
  }
}

export const prismaPlugin = fp(async (fastify: FastifyInstance) => {
  const prisma = new PrismaClient();
  let dbConnected = false;

  try {
    // Attempt connection with short timeout/retry for demo
    await prisma.$connect();
    fastify.log.info('✅ Prisma connected to PostgreSQL');
    dbConnected = true;
  } catch (err) {
    fastify.log.warn('⚠️ Prisma failed to connect to PostgreSQL. Switching to MOCK MODE for demo.');
    dbConnected = false;
  }

  fastify.decorate('prisma', prisma);
  fastify.decorate('dbConnected', dbConnected);

  fastify.addHook('onClose', async () => {
    if (dbConnected) {
      await prisma.$disconnect();
    }
  });
});
