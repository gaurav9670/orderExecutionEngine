import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { config } from './config';
import { logger } from './utils/logger';
import { orderRoutes } from './routes/orders.route';
import { db } from './database';
import { orderQueue } from './queues/order.queue';

const app = Fastify({
  logger: false,
});

app.register(websocket);

app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

app.register(orderRoutes);

const start = async () => {
  try {
    await app.listen({ port: config.server.port, host: '0.0.0.0' });
    logger.info(`Server running on port ${config.server.port}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  try {
    await orderQueue.close();
    await db.close();
    await app.close();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

start();
