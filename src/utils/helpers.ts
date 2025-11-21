export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateMockTxHash(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = '';
  for (let i = 0; i < 88; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function calculateExponentialBackoff(attempt: number, baseDelayMs: number): number {
  return Math.min(baseDelayMs * Math.pow(2, attempt), 30000);
}
