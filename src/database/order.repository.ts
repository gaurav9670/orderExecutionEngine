import { db } from '../database';
import { Order, OrderStatus } from '../types';
import { logger } from '../utils/logger';

export class OrderRepository {
  async create(order: Order): Promise<Order> {
    const query = `
      INSERT INTO orders (
        id, type, token_in, token_out, amount_in, limit_price, 
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      order.id,
      order.type,
      order.tokenIn,
      order.tokenOut,
      order.amountIn,
      order.limitPrice,
      order.status,
      order.createdAt,
      order.updatedAt,
    ];

    try {
      const result = await db.query(query, values);
      return this.mapRowToOrder(result.rows[0]);
    } catch (error) {
      logger.error({ error, orderId: order.id }, 'Failed to create order');
      throw error;
    }
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    updates?: {
      selectedDex?: string;
      executedPrice?: number;
      txHash?: string;
      error?: string;
    }
  ): Promise<void> {
    const query = `
      UPDATE orders 
      SET status = $1, 
          selected_dex = COALESCE($2, selected_dex),
          executed_price = COALESCE($3, executed_price),
          tx_hash = COALESCE($4, tx_hash),
          error = COALESCE($5, error),
          updated_at = $6
      WHERE id = $7
    `;

    const values = [
      status,
      updates?.selectedDex || null,
      updates?.executedPrice || null,
      updates?.txHash || null,
      updates?.error || null,
      new Date(),
      orderId,
    ];

    try {
      await db.query(query, values);
      await this.addStatusHistory(orderId, status, updates);
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to update order status');
      throw error;
    }
  }

  async findById(orderId: string): Promise<Order | null> {
    const query = 'SELECT * FROM orders WHERE id = $1';
    try {
      const result = await db.query(query, [orderId]);
      return result.rows.length > 0 ? this.mapRowToOrder(result.rows[0]) : null;
    } catch (error) {
      logger.error({ error, orderId }, 'Failed to find order');
      throw error;
    }
  }

  async findAll(limit = 100, offset = 0): Promise<Order[]> {
    const query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    try {
      const result = await db.query(query, [limit, offset]);
      return result.rows.map(row => this.mapRowToOrder(row));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch orders');
      throw error;
    }
  }

  private async addStatusHistory(
    orderId: string,
    status: OrderStatus,
    updates?: {
      selectedDex?: string;
      executedPrice?: number;
      txHash?: string;
      error?: string;
    }
  ): Promise<void> {
    const query = `
      INSERT INTO order_status_history 
      (order_id, status, selected_dex, executed_price, tx_hash, error)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
      orderId,
      status,
      updates?.selectedDex || null,
      updates?.executedPrice || null,
      updates?.txHash || null,
      updates?.error || null,
    ];

    await db.query(query, values);
  }

  private mapRowToOrder(row: any): Order {
    return {
      id: row.id,
      type: row.type,
      tokenIn: row.token_in,
      tokenOut: row.token_out,
      amountIn: parseFloat(row.amount_in),
      limitPrice: parseFloat(row.limit_price),
      status: row.status,
      selectedDex: row.selected_dex,
      executedPrice: row.executed_price ? parseFloat(row.executed_price) : undefined,
      txHash: row.tx_hash,
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const orderRepository = new OrderRepository();
