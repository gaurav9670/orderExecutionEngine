import { orderService } from '../services/order.service';
import { OrderType, OrderStatus } from '../types';

describe('Order Service Integration', () => {
  describe('createOrder', () => {
    it('should create a new limit order', async () => {
      const input = {
        type: OrderType.LIMIT,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 100,
        limitPrice: 25.5,
      };

      const order = await orderService.createOrder(input);

      expect(order).toHaveProperty('id');
      expect(order.id).toMatch(/^ord_\d+_[a-z0-9]+$/);
      expect(order.type).toBe(OrderType.LIMIT);
      expect(order.tokenIn).toBe('SOL');
      expect(order.tokenOut).toBe('USDC');
      expect(order.amountIn).toBe(100);
      expect(order.limitPrice).toBe(25.5);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.createdAt).toBeInstanceOf(Date);
      expect(order.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status with additional data', async () => {
      const input = {
        type: OrderType.LIMIT,
        tokenIn: 'SOL',
        tokenOut: 'USDC',
        amountIn: 50,
        limitPrice: 20,
      };

      const order = await orderService.createOrder(input);

      await orderService.updateOrderStatus(order.id, OrderStatus.ROUTING);
      
      let updatedOrder = await orderService.getOrder(order.id);
      expect(updatedOrder?.status).toBe(OrderStatus.ROUTING);

      await orderService.updateOrderStatus(order.id, OrderStatus.CONFIRMED, {
        selectedDex: 'meteora',
        executedPrice: 20.5,
        txHash: 'mock_tx_hash_123',
      });

      updatedOrder = await orderService.getOrder(order.id);
      expect(updatedOrder?.status).toBe(OrderStatus.CONFIRMED);
      expect(updatedOrder?.selectedDex).toBe('meteora');
      expect(updatedOrder?.executedPrice).toBe(20.5);
      expect(updatedOrder?.txHash).toBe('mock_tx_hash_123');
    });
  });

  describe('getOrder', () => {
    it('should retrieve order by id', async () => {
      const input = {
        type: OrderType.LIMIT,
        tokenIn: 'ETH',
        tokenOut: 'USDC',
        amountIn: 10,
        limitPrice: 2000,
      };

      const createdOrder = await orderService.createOrder(input);
      const retrievedOrder = await orderService.getOrder(createdOrder.id);

      expect(retrievedOrder).not.toBeNull();
      expect(retrievedOrder?.id).toBe(createdOrder.id);
      expect(retrievedOrder?.tokenIn).toBe('ETH');
    });

    it('should return null for non-existent order', async () => {
      const order = await orderService.getOrder('non_existent_id');
      expect(order).toBeNull();
    });
  });

  describe('getAllOrders', () => {
    it('should retrieve multiple orders with pagination', async () => {
      const orders = await orderService.getAllOrders(10, 0);
      
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeLessThanOrEqual(10);
      
      if (orders.length > 0) {
        expect(orders[0]).toHaveProperty('id');
        expect(orders[0]).toHaveProperty('status');
      }
    });
  });
});
