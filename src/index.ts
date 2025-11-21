import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { config } from './config';
import { logger } from './utils/logger';

const app = Fastify({
  logger: false,
});

app.register(websocket);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

const start = async () => {
  try {
    await app.listen({ port: config.server.port, host: '0.0.0.0' });
    logger.info(`Server running on port ${config.server.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
