import { createOrderSchema } from './order.schema';
import { OrderType } from '../types';

describe('Order Schema Validation', () => {
  describe('createOrderSchema', () => {
    const validOrder = {
      type: OrderType.LIMIT,
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 100,
      limitPrice: 25.5,
    };

    it('should validate a correct order', () => {
      const result = createOrderSchema.safeParse(validOrder);
      expect(result.success).toBe(true);
    });

    it('should reject order without type', () => {
      const { type: _type, ...orderWithoutType } = validOrder;
      const result = createOrderSchema.safeParse(orderWithoutType);
      expect(result.success).toBe(false);
    });

    it('should reject order with wrong type', () => {
      const invalidOrder = { ...validOrder, type: 'market' };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order without tokenIn', () => {
      const { tokenIn: _tokenIn, ...orderWithoutToken } = validOrder;
      const result = createOrderSchema.safeParse(orderWithoutToken);
      expect(result.success).toBe(false);
    });

    it('should reject order without tokenOut', () => {
      const { tokenOut: _tokenOut, ...orderWithoutToken } = validOrder;
      const result = createOrderSchema.safeParse(orderWithoutToken);
      expect(result.success).toBe(false);
    });

    it('should reject order with negative amount', () => {
      const invalidOrder = { ...validOrder, amountIn: -10 };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order with zero amount', () => {
      const invalidOrder = { ...validOrder, amountIn: 0 };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject order with negative limit price', () => {
      const invalidOrder = { ...validOrder, limitPrice: -5 };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should accept order with decimal values', () => {
      const decimalOrder = {
        ...validOrder,
        amountIn: 10.5,
        limitPrice: 25.789,
      };
      const result = createOrderSchema.safeParse(decimalOrder);
      expect(result.success).toBe(true);
    });

    it('should reject empty tokenIn', () => {
      const invalidOrder = { ...validOrder, tokenIn: '' };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });

    it('should reject empty tokenOut', () => {
      const invalidOrder = { ...validOrder, tokenOut: '' };
      const result = createOrderSchema.safeParse(invalidOrder);
      expect(result.success).toBe(false);
    });
  });
});
