import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../database/redis';
import { config } from '../config';
import { logger } from '../utils/logger';
import { OrderStatus } from '../types';
import { orderService } from '../services/order.service';
import { dexRouter } from '../services/dex-router.service';
import { calculateExponentialBackoff } from '../utils/helpers';

export interface OrderJobData {
  orderId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  limitPrice: number;
}

export class OrderQueue {
  private queue: Queue<OrderJobData>;
  private worker: Worker<OrderJobData>;
  private statusUpdateCallbacks: Map<string, (status: OrderStatus, data?: any) => void>;

  constructor() {
    this.statusUpdateCallbacks = new Map();

    this.queue = new Queue<OrderJobData>('order-execution', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: config.orderProcessing.maxRetries,
        backoff: {
          type: 'exponential',
          delay: config.orderProcessing.retryDelayMs,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 5000,
          age: 7 * 24 * 3600,
        },
      },
    });

    this.worker = new Worker<OrderJobData>(
      'order-execution',
      async (job: Job<OrderJobData>) => this.processOrder(job),
      {
        connection: redisConnection,
        concurrency: config.orderProcessing.maxConcurrent,
      }
    );

    this.setupWorkerListeners();
  }

  async addOrder(data: OrderJobData): Promise<string> {
    const job = await this.queue.add('execute-order', data, {
      jobId: data.orderId,
    });
    
    logger.info({ orderId: data.orderId, jobId: job.id }, 'Order added to queue');
    return job.id || data.orderId;
  }

  registerStatusCallback(orderId: string, callback: (status: OrderStatus, data?: any) => void) {
    this.statusUpdateCallbacks.set(orderId, callback);
  }

  unregisterStatusCallback(orderId: string) {
    this.statusUpdateCallbacks.delete(orderId);
  }

  private async processOrder(job: Job<OrderJobData>): Promise<void> {
    const { orderId, tokenIn, tokenOut, amountIn, limitPrice } = job.data;
    
    logger.info({ orderId, attempt: job.attemptsMade + 1 }, 'Processing order');

    try {
      await this.updateStatus(orderId, OrderStatus.ROUTING);

      const bestQuote = await dexRouter.getBestQuote(tokenIn, tokenOut, amountIn);

      if (bestQuote.price > limitPrice) {
        logger.info(
          { orderId, marketPrice: bestQuote.price, limitPrice },
          'Limit price not met, order will retry'
        );
        
        const delay = calculateExponentialBackoff(job.attemptsMade, config.orderProcessing.retryDelayMs);
        throw new Error(`Limit price ${limitPrice} not met. Current best price: ${bestQuote.price}. Retrying in ${delay}ms`);
      }

      await this.updateStatus(orderId, OrderStatus.BUILDING, {
        selectedDex: bestQuote.provider,
      });

      const minAmountOut = bestQuote.estimatedOutput * 0.98;

      await this.updateStatus(orderId, OrderStatus.SUBMITTED);

      const swapResult = await dexRouter.executeSwap(
        bestQuote.provider,
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut
      );

      await this.updateStatus(orderId, OrderStatus.CONFIRMED, {
        selectedDex: swapResult.dex,
        executedPrice: swapResult.executedPrice,
        txHash: swapResult.txHash,
      });

      logger.info({ orderId, txHash: swapResult.txHash }, 'Order executed successfully');

    } catch (error: any) {
      logger.error({ error, orderId, attempt: job.attemptsMade + 1 }, 'Order processing error');

      if (job.attemptsMade + 1 >= config.orderProcessing.maxRetries) {
        await this.updateStatus(orderId, OrderStatus.FAILED, {
          error: error.message || 'Order execution failed after max retries',
        });
        logger.error({ orderId }, 'Order failed after max retry attempts');
      }

      throw error;
    }
  }

  private async updateStatus(
    orderId: string,
    status: OrderStatus,
    updates?: {
      selectedDex?: string;
      executedPrice?: number;
      txHash?: string;
      error?: string;
    }
  ): Promise<void> {
    await orderService.updateOrderStatus(orderId, status, updates);

    const callback = this.statusUpdateCallbacks.get(orderId);
    if (callback) {
      callback(status, updates);
    }
  }

  private setupWorkerListeners() {
    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id, orderId: job.data.orderId }, 'Job completed');
    });

    this.worker.on('failed', (job, err) => {
      if (job) {
        logger.error(
          { jobId: job.id, orderId: job.data.orderId, error: err.message },
          'Job failed'
        );
      }
    });

    this.worker.on('error', (err) => {
      logger.error({ error: err }, 'Worker error');
    });
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
    logger.info('Order queue closed');
  }

  async getQueueMetrics() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}

export const orderQueue = new OrderQueue();
