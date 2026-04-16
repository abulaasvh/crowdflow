// @ts-nocheck
import Fastify from 'fastify';
import mercurius from 'mercurius';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import pino from 'pino';

const server = Fastify({ logger: true });

async function main() {
  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(cors);

  await server.register(mercurius, {
    schema: typeDefs,
    resolvers,
    graphiql: true,
  });

  const port = Number(process.env['ORDER_SERVICE_PORT']) || 4003;
  const host = '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`🚀 Order Service running at http://localhost:${port}/graphql`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
