import { Order, OrderStatus, OrderType } from '../types';
import { orderRepository } from '../database/order.repository';
import { generateOrderId } from '../utils/helpers';
import { CreateOrderInput } from '../models/order.schema';

export class OrderService {
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const order: Order = {
      id: generateOrderId(),
      type: OrderType.LIMIT,
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: input.amountIn,
      limitPrice: input.limitPrice,
      status: OrderStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return orderRepository.create(order);
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return orderRepository.findById(orderId);
  }

  async getAllOrders(limit?: number, offset?: number): Promise<Order[]> {
    return orderRepository.findAll(limit, offset);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    updates?: {
      selectedDex?: string;
      executedPrice?: number;
      txHash?: string;
      error?: string;
    }
  ): Promise<void> {
    await orderRepository.updateStatus(orderId, status, updates);
  }
}

export const orderService = new OrderService();
