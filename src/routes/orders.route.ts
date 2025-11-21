import { FastifyInstance, FastifyRequest } from 'fastify';
import { createOrderSchema, CreateOrderInput } from '../models/order.schema';
import { orderService } from '../services/order.service';
import { orderQueue } from '../queues/order.queue';
import { OrderStatus, OrderUpdateMessage } from '../types';
import { logger } from '../utils/logger';

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateOrderInput }>('/api/orders', async (req, reply) => {
    try {
      const validatedInput = createOrderSchema.parse(req.body);
      const order = await orderService.createOrder(validatedInput);

      await orderQueue.addOrder({
        orderId: order.id,
        tokenIn: validatedInput.tokenIn,
        tokenOut: validatedInput.tokenOut,
        amountIn: validatedInput.amountIn,
        limitPrice: validatedInput.limitPrice,
      });

      return reply.code(201).send({
        orderId: order.id,
        status: order.status,
        message: 'Order created successfully. Connect to WebSocket for updates.',
        wsUrl: `/api/orders/${order.id}/ws`,
      });
    } catch (error: any) {
      logger.error({ error }, 'Error creating order');
      return reply.code(400).send({
        error: error.message || 'Failed to create order',
      });
    }
  });

  app.get(
    '/api/orders/:orderId/ws',
    { websocket: true },
    async (connection: any, req: FastifyRequest) => {
      const socket = connection.socket;
      const { orderId } = req.params as { orderId: string };

      try {
        const order = await orderService.getOrder(orderId);
        
        if (!order) {
          socket.send(JSON.stringify({ type: 'error', message: 'Order not found' }));
          socket.close();
          return;
        }

        socket.send(
          JSON.stringify({
            type: 'connected',
            orderId: order.id,
            status: order.status,
          })
        );

        logger.info({ orderId }, 'WebSocket connected for order updates');

        orderQueue.registerStatusCallback(orderId, (status: OrderStatus, data?: any) => {
          const update: OrderUpdateMessage = {
            orderId,
            status,
            selectedDex: data?.selectedDex,
            executedPrice: data?.executedPrice,
            txHash: data?.txHash,
            error: data?.error,
            timestamp: new Date(),
          };

          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: 'status_update', ...update }));
            logger.debug({ orderId, status }, 'Status update sent via WebSocket');
          }
        });

        socket.on('close', () => {
          orderQueue.unregisterStatusCallback(orderId);
          logger.info({ orderId }, 'WebSocket connection closed');
        });

        socket.on('error', (err: Error) => {
          logger.error({ err, orderId }, 'WebSocket error');
          orderQueue.unregisterStatusCallback(orderId);
        });

      } catch (error: any) {
        logger.error({ error }, 'Error in WebSocket connection');
        
        if (socket.readyState === 1) {
          socket.send(
            JSON.stringify({
              type: 'error',
              message: error.message || 'WebSocket connection failed',
            })
          );
          socket.close();
        }
      }
    }
  );

  app.get('/api/orders/:orderId', async (req, reply) => {
    const { orderId } = req.params as { orderId: string };
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return reply.code(404).send({ error: 'Order not found' });
    }

    return order;
  });

  app.get('/api/orders', async (req) => {
    const { limit = 100, offset = 0 } = req.query as { limit?: number; offset?: number };
    const orders = await orderService.getAllOrders(limit, offset);
    return { orders, count: orders.length };
  });

  app.get('/api/queue/metrics', async () => {
    const metrics = await orderQueue.getQueueMetrics();
    return metrics;
  });
}
