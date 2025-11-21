import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'order_engine',
    user: process.env.POSTGRES_USER || 'admin',
    password: process.env.POSTGRES_PASSWORD || 'password123',
  },
  orderProcessing: {
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT_ORDERS || '10', 10),
    maxRetries: parseInt(process.env.MAX_RETRY_ATTEMPTS || '3', 10),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
  },
  dex: {
    mockMode: process.env.MOCK_MODE === 'true',
    raydiumQuoteDelay: parseInt(process.env.RAYDIUM_QUOTE_DELAY_MS || '200', 10),
    meteoraQuoteDelay: parseInt(process.env.METEORA_QUOTE_DELAY_MS || '200', 10),
    swapExecutionDelay: parseInt(process.env.SWAP_EXECUTION_DELAY_MS || '2500', 10),
  },
};
