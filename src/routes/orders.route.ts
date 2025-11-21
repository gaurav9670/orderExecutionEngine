import { FastifyInstance, FastifyRequest } from 'fastify';
import { createOrderSchema, CreateOrderInput } from '../models/order.schema';
import { orderService } from '../services/order.service';
import { orderQueue } from '../queues/order.queue';
import { OrderStatus, OrderUpdateMessage } from '../types';
import { logger } from '../utils/logger';

export async function orderRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateOrderInput }>(
    '/api/orders/execute',
    {
      websocket: true,
      schema: {
        body: {
          type: 'object',
          required: ['type', 'tokenIn', 'tokenOut', 'amountIn', 'limitPrice'],
          properties: {
            type: { type: 'string', enum: ['limit'] },
            tokenIn: { type: 'string' },
            tokenOut: { type: 'string' },
            amountIn: { type: 'number' },
            limitPrice: { type: 'number' },
          },
        },
      },
    },
    async (connection: any, req: FastifyRequest) => {
      const socket = connection.socket;

      try {
        const body = req.body as CreateOrderInput;
        const validatedInput = createOrderSchema.parse(body);

        const order = await orderService.createOrder(validatedInput);

        socket.send(
          JSON.stringify({
            type: 'order_created',
            orderId: order.id,
            status: order.status,
          })
        );

        logger.info({ orderId: order.id }, 'Order created, WebSocket connected');

        orderQueue.registerStatusCallback(order.id, (status: OrderStatus, data?: any) => {
          const update: OrderUpdateMessage = {
            orderId: order.id,
            status,
            selectedDex: data?.selectedDex,
            executedPrice: data?.executedPrice,
            txHash: data?.txHash,
            error: data?.error,
            timestamp: new Date(),
          };

          if (socket.readyState === 1) {
            socket.send(JSON.stringify({ type: 'status_update', ...update }));
            logger.debug({ orderId: order.id, status }, 'Status update sent via WebSocket');
          }
        });

        await orderQueue.addOrder({
          orderId: order.id,
          tokenIn: validatedInput.tokenIn,
          tokenOut: validatedInput.tokenOut,
          amountIn: validatedInput.amountIn,
          limitPrice: validatedInput.limitPrice,
        });

        socket.on('close', () => {
          orderQueue.unregisterStatusCallback(order.id);
          logger.info({ orderId: order.id }, 'WebSocket connection closed');
        });

        socket.on('error', (err: Error) => {
          logger.error({ err, orderId: order.id }, 'WebSocket error');
          orderQueue.unregisterStatusCallback(order.id);
        });

      } catch (error: any) {
        logger.error({ error }, 'Error processing order request');
        
        if (socket.readyState === 1) {
          socket.send(
            JSON.stringify({
              type: 'error',
              message: error.message || 'Failed to process order',
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
