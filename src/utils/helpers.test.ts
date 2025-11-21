import { generateOrderId, generateMockTxHash, calculateExponentialBackoff, sleep } from './helpers';

describe('Helpers', () => {
  describe('generateOrderId', () => {
    it('should generate unique order IDs', () => {
      const id1 = generateOrderId();
      const id2 = generateOrderId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^ord_\d+_[a-z0-9]+$/);
    });

    it('should have correct prefix', () => {
      const id = generateOrderId();
      expect(id.startsWith('ord_')).toBe(true);
    });
  });

  describe('generateMockTxHash', () => {
    it('should generate 88 character hash', () => {
      const hash = generateMockTxHash();
      expect(hash).toHaveLength(88);
    });

    it('should generate unique hashes', () => {
      const hash1 = generateMockTxHash();
      const hash2 = generateMockTxHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should only contain valid base58 characters', () => {
      const hash = generateMockTxHash();
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      expect(hash).toMatch(base58Regex);
    });
  });

  describe('calculateExponentialBackoff', () => {
    it('should calculate correct backoff for first attempt', () => {
      const delay = calculateExponentialBackoff(0, 1000);
      expect(delay).toBe(1000);
    });

    it('should double delay for each attempt', () => {
      const baseDelay = 1000;
      expect(calculateExponentialBackoff(1, baseDelay)).toBe(2000);
      expect(calculateExponentialBackoff(2, baseDelay)).toBe(4000);
      expect(calculateExponentialBackoff(3, baseDelay)).toBe(8000);
    });

    it('should cap at 30 seconds', () => {
      const delay = calculateExponentialBackoff(10, 1000);
      expect(delay).toBe(30000);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified delay', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(150);
    });
  });
});
