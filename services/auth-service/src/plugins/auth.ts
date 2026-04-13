/**
 * Auth Plugin for Fastify
 *
 * Adds JWT verification as a Fastify decorator. Routes can use
 * `request.user` to access the authenticated user's JWT payload.
 * Supports both custom JWT and Firebase Auth token verification.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { verifyAccessToken } from '../utils/jwt';
import type { JWTPayload } from '@crowdflow/shared-types';

// Extend Fastify request type with user payload
declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload | null;
  }
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  // Decorator to attach authenticated user to request
  fastify.decorateRequest('user', null);

  /**
   * Pre-handler hook: extracts and verifies the JWT from the
   * Authorization header on every request. Sets request.user
   * to the decoded payload or null if no/invalid token.
   *
   * This does NOT reject unauthenticated requests — that's left
   * to individual resolvers which check request.user explicitly.
   */
  fastify.addHook('preHandler', async (request: FastifyRequest) => {
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      request.user = null;
      return;
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix

    try {
      const payload = verifyAccessToken(token);
      request.user = payload;
    } catch {
      // Invalid/expired token — request proceeds as unauthenticated
      request.user = null;
    }
  });
});
