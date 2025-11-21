import { DexRouterService } from '../services/dex-router.service';
import { DexProvider } from '../types';

describe('DexRouterService', () => {
  let dexRouter: DexRouterService;

  beforeEach(() => {
    dexRouter = new DexRouterService();
  });

  describe('getRaydiumQuote', () => {
    it('should return a quote with correct structure', async () => {
      const quote = await dexRouter.getRaydiumQuote('SOL', 'USDC', 100);

      expect(quote).toHaveProperty('provider', DexProvider.RAYDIUM);
      expect(quote).toHaveProperty('price');
      expect(quote).toHaveProperty('fee', 0.003);
      expect(quote).toHaveProperty('estimatedOutput');
      expect(quote.price).toBeGreaterThan(0);
      expect(quote.estimatedOutput).toBeGreaterThan(0);
    });

    it('should calculate output with fee deduction', async () => {
      const amountIn = 100;
      const quote = await dexRouter.getRaydiumQuote('SOL', 'USDC', amountIn);

      const expectedOutput = amountIn * quote.price * (1 - quote.fee);
      expect(quote.estimatedOutput).toBeCloseTo(expectedOutput, 6);
    });
  });

  describe('getMeteorQuote', () => {
    it('should return a quote with Meteora provider', async () => {
      const quote = await dexRouter.getMeteorQuote('SOL', 'USDC', 100);

      expect(quote.provider).toBe(DexProvider.METEORA);
      expect(quote.fee).toBe(0.002);
    });

    it('should have lower fee than Raydium', async () => {
      const meteoraQuote = await dexRouter.getMeteorQuote('SOL', 'USDC', 100);
      const raydiumQuote = await dexRouter.getRaydiumQuote('SOL', 'USDC', 100);

      expect(meteoraQuote.fee).toBeLessThan(raydiumQuote.fee);
    });
  });

  describe('getBestQuote', () => {
    it('should return the quote with higher output', async () => {
      const bestQuote = await dexRouter.getBestQuote('SOL', 'USDC', 100);

      expect(bestQuote).toHaveProperty('provider');
      expect([DexProvider.RAYDIUM, DexProvider.METEORA]).toContain(bestQuote.provider);
      expect(bestQuote.estimatedOutput).toBeGreaterThan(0);
    });

    it('should compare both DEX quotes', async () => {
      const [raydium, meteora, best] = await Promise.all([
        dexRouter.getRaydiumQuote('SOL', 'USDC', 100),
        dexRouter.getMeteorQuote('SOL', 'USDC', 100),
        dexRouter.getBestQuote('SOL', 'USDC', 100),
      ]);

      const expectedBest = raydium.estimatedOutput > meteora.estimatedOutput ? raydium : meteora;
      expect(best.provider).toBe(expectedBest.provider);
    });
  });

  describe('executeSwap', () => {
    it('should execute swap and return transaction details', async () => {
      const result = await dexRouter.executeSwap(
        DexProvider.RAYDIUM,
        'SOL',
        'USDC',
        100,
        95
      );

      expect(result).toHaveProperty('txHash');
      expect(result).toHaveProperty('executedPrice');
      expect(result).toHaveProperty('amountOut');
      expect(result).toHaveProperty('dex', DexProvider.RAYDIUM);
      expect(result.txHash).toHaveLength(88);
    });

    it('should throw error if slippage exceeds tolerance', async () => {
      await expect(
        dexRouter.executeSwap(DexProvider.RAYDIUM, 'SOL', 'USDC', 100, 999999)
      ).rejects.toThrow('Slippage tolerance exceeded');
    });
  });
});
