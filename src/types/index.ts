export enum OrderType {
  LIMIT = 'limit',
}

export enum OrderStatus {
  PENDING = 'pending',
  ROUTING = 'routing',
  BUILDING = 'building',
  SUBMITTED = 'submitted',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum DexProvider {
  RAYDIUM = 'raydium',
  METEORA = 'meteora',
}

export interface Order {
  id: string;
  type: OrderType;
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  limitPrice: number;
  status: OrderStatus;
  selectedDex?: DexProvider;
  executedPrice?: number;
  txHash?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DexQuote {
  provider: DexProvider;
  price: number;
  fee: number;
  estimatedOutput: number;
}

export interface SwapResult {
  txHash: string;
  executedPrice: number;
  amountOut: number;
  dex: DexProvider;
}

export interface OrderUpdateMessage {
  orderId: string;
  status: OrderStatus;
  selectedDex?: DexProvider;
  executedPrice?: number;
  txHash?: string;
  error?: string;
  timestamp: Date;
}
