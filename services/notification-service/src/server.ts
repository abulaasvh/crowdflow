// @ts-nocheck
import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as admin from 'firebase-admin';
import { z } from 'zod';
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

// Initialize Firebase Admin (using placeholder or env)
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    server.log.info('🔥 Firebase Admin initialized');
  } else {
    server.log.warn('⚠️ No FIREBASE_SERVICE_ACCOUNT env found. Push notifications will be mocked.');
  }
} catch (err) {
  server.log.error('❌ Failed to initialize Firebase Admin:', err);
}

const SendNotificationSchema = z.object({
  token: z.string().optional(), // Single device
  topic: z.string().optional(), // Group/Zone
  title: z.string(),
  body: z.string(),
  data: z.record(z.string()).optional(),
});

server.post('/send', async (request, reply) => {
  const parseResult = SendNotificationSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({ error: parseResult.error });
  }

  const { token, topic, title, body, data } = parseResult.data;

  const message: any = {
    notification: { title, body },
    data: data || {},
  };

  if (token) message.token = token;
  else if (topic) message.topic = topic;
  else return reply.status(400).send({ error: 'Either token or topic is required' });

  try {
    if (admin.apps.length > 0) {
      const response = await admin.messaging().send(message);
      return { success: true, messageId: response };
    } else {
      // Mock success for demo
      server.log.info('🔔 MOCK NOTIFICATION SENT:', { title, body, topic, token });
      return { success: true, mock: true };
    }
  } catch (err) {
    server.log.error(err);
    return reply.status(500).send({ error: 'Failed to send notification' });
  }
});

const start = async () => {
  const port = Number(process.env.NOTIFICATION_SERVICE_PORT) || 4005;
  try {
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Notification Service running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
