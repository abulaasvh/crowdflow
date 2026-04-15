// @ts-nocheck
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { findOptimalPath } from './router';
import pino from 'pino';

const server = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  }
});

server.register(cors);

server.get('/route', async (request, reply) => {
  const { start, end } = request.query as { start: string; end: string };

  if (!start || !end) {
    return reply.status(400).send({ error: 'Start and end nodes are required' });
  }

  try {
    const result = await findOptimalPath(start, end);
    return result;
  } catch (err) {
    server.log.error(err);
    return reply.status(500).send({ error: 'Failed to calculate route' });
  }
});

server.get('/nodes', async () => {
  const { STADIUM_NODES } = await import('./graph');
  return STADIUM_NODES;
});

const start = async () => {
  const port = Number(process.env['NAVIGATION_SERVICE_PORT']) || 4004;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Navigation Service running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
