/**
 * Pino Logger Configuration
 *
 * Structured JSON logging in production, pretty-printed in development.
 * Redacts sensitive fields to prevent credential leaks in logs.
 */

import pino from 'pino';

export const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  // Redact sensitive fields — GDPR + security compliance
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      'firebaseIdToken',
    ],
    censor: '[REDACTED]',
  },
  transport:
    process.env['NODE_ENV'] !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});
