import { DexProvider, DexQuote, SwapResult } from '../types';
import { config } from '../config';
import { sleep, generateMockTxHash } from '../utils/helpers';
import { logger } from '../utils/logger';

export class DexRouterService {
  async getRaydiumQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<DexQuote> {
    await sleep(config.dex.raydiumQuoteDelay);

    const basePrice = this.getMockBasePrice(tokenIn, tokenOut);
    const variance = 0.98 + Math.random() * 0.04;
    const price = basePrice * variance;
    const fee = 0.003;
    const estimatedOutput = (amountIn * price) * (1 - fee);

    logger.debug(
      { tokenIn, tokenOut, amountIn, price, estimatedOutput },
      'Raydium quote fetched'
    );

    return {
      provider: DexProvider.RAYDIUM,
      price,
      fee,
      estimatedOutput,
    };
  }

  async getMeteorQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<DexQuote> {
    await sleep(config.dex.meteoraQuoteDelay);

    const basePrice = this.getMockBasePrice(tokenIn, tokenOut);
    const variance = 0.97 + Math.random() * 0.05;
    const price = basePrice * variance;
    const fee = 0.002;
    const estimatedOutput = (amountIn * price) * (1 - fee);

    logger.debug(
      { tokenIn, tokenOut, amountIn, price, estimatedOutput },
      'Meteora quote fetched'
    );

    return {
      provider: DexProvider.METEORA,
      price,
      fee,
      estimatedOutput,
    };
  }

  async getBestQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: number
  ): Promise<DexQuote> {
    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.getRaydiumQuote(tokenIn, tokenOut, amountIn),
      this.getMeteorQuote(tokenIn, tokenOut, amountIn),
    ]);

    const bestQuote = raydiumQuote.estimatedOutput > meteoraQuote.estimatedOutput
      ? raydiumQuote
      : meteoraQuote;

    logger.info(
      {
        raydiumOutput: raydiumQuote.estimatedOutput,
        meteoraOutput: meteoraQuote.estimatedOutput,
        selectedDex: bestQuote.provider,
      },
      'DEX routing decision made'
    );

    return bestQuote;
  }

  async executeSwap(
    dex: DexProvider,
    tokenIn: string,
    tokenOut: string,
    amountIn: number,
    minAmountOut: number
  ): Promise<SwapResult> {
    await sleep(config.dex.swapExecutionDelay);

    const quote = dex === DexProvider.RAYDIUM
      ? await this.getRaydiumQuote(tokenIn, tokenOut, amountIn)
      : await this.getMeteorQuote(tokenIn, tokenOut, amountIn);

    const slippage = 0.99 + Math.random() * 0.01;
    const actualOutput = quote.estimatedOutput * slippage;

    if (actualOutput < minAmountOut) {
      throw new Error('Slippage tolerance exceeded');
    }

    const txHash = generateMockTxHash();

    logger.info(
      { dex, txHash, executedPrice: quote.price, amountOut: actualOutput },
      'Swap executed successfully'
    );

    return {
      txHash,
      executedPrice: quote.price,
      amountOut: actualOutput,
      dex,
    };
  }

  private getMockBasePrice(tokenIn: string, tokenOut: string): number {
    const hash = `${tokenIn}-${tokenOut}`.split('').reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return 0.8 + (hash % 100) / 100;
  }
}

export const dexRouter = new DexRouterService();
