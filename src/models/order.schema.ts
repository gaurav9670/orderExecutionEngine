import { z } from 'zod';
import { OrderType } from '../types';

export const createOrderSchema = z.object({
  type: z.literal(OrderType.LIMIT),
  tokenIn: z.string().min(1, 'Token in is required'),
  tokenOut: z.string().min(1, 'Token out is required'),
  amountIn: z.number().positive('Amount must be positive'),
  limitPrice: z.number().positive('Limit price must be positive'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
