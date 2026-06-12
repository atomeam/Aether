/**
 * Gas Utilities
 * Helper functions for gas estimation and fee calculation
 */

import { GasEstimate, FeeHistory, GasPrice } from '../types';
import { fromWei, gweiToWei, weiToGwei } from './units';

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(
  transaction: any,
  provider: any
): Promise<GasEstimate> {
  try {
    const gasLimit = await provider.estimateGas(transaction);
    const feeData = await provider.getFeeData();

    const estimate: GasEstimate = {
      gasLimit: gasLimit.toString(),
    };

    if (feeData.gasPrice) {
      estimate.gasPrice = feeData.gasPrice.toString();
    }

    if (feeData.maxFeePerGas) {
      estimate.maxFeePerGas = feeData.maxFeePerGas.toString();
    }

    if (feeData.maxPriorityFeePerGas) {
      estimate.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
    }

    // Calculate estimated cost
    const gasLimitBig = BigInt(gasLimit);
    const gasPriceBig = feeData.maxFeePerGas || feeData.gasPrice || BigInt(0);
    const costWei = gasLimitBig * gasPriceBig;
    estimate.estimatedCost = fromWei(costWei, 18);

    return estimate;
  } catch (error) {
    throw new Error(`Gas estimation failed: ${error}`);
  }
}

/**
 * Get fee history for EIP-1559 transactions
 */
export async function getFeeHistory(
  provider: any,
  blockCount: number = 4,
  rewardPercentiles: number[] = [25, 50, 75]
): Promise<FeeHistory> {
  try {
    const latestBlock = await provider.getBlockNumber();
    const history = await provider.getFeeHistory(
      blockCount,
      latestBlock,
      rewardPercentiles
    );

    return {
      oldestBlock: history.oldestBlock,
      baseFeePerGas: history.baseFeePerGas.map((fee: bigint) => fee.toString()),
      gasUsedRatio: history.gasUsedRatio,
      reward: history.reward.map((rewards: bigint[]) =>
        rewards.map((reward: bigint) => reward.toString())
      ),
    };
  } catch (error) {
    throw new Error(`Failed to get fee history: ${error}`);
  }
}

/**
 * Calculate EIP-1559 gas fees
 */
export function calculateEIP1559Fees(
  feeHistory: FeeHistory,
  priority: 'slow' | 'average' | 'fast' = 'average'
): { maxFeePerGas: string; maxPriorityFeePerGas: string } {
  const baseFees = feeHistory.baseFeePerGas.map((fee) => BigInt(fee));
  const latestBaseFee = baseFees[baseFees.length - 1];

  // Calculate next block's base fee (EIP-1559 formula)
  const gasUsedRatio = feeHistory.gasUsedRatio[feeHistory.gasUsedRatio.length - 1] || 0.5;
  const baseFeeChange = 1 + (gasUsedRatio - 0.5) * 0.125;
  const nextBaseFee = (latestBaseFee * BigInt(Math.floor(baseFeeChange * 100))) / 100n;

  // Get priority fee based on priority level
  const rewardIndex = priority === 'slow' ? 0 : priority === 'average' ? 1 : 2;
  const rewards = feeHistory.reward[feeHistory.reward.length - 1] || ['0', '0', '0'];
  const priorityFee = BigInt(rewards[rewardIndex] || rewards[1]);

  // Max fee = base fee + 2 * priority fee (buffer)
  const maxFeePerGas = nextBaseFee + priorityFee * 2n;
  const maxPriorityFeePerGas = priorityFee;

  return {
    maxFeePerGas: maxFeePerGas.toString(),
    maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
  };
}

/**
 * Get current gas prices
 */
export async function getGasPrices(provider: any): Promise<GasPrice> {
  try {
    const feeData = await provider.getFeeData();

    if (feeData.gasPrice) {
      // Legacy network
      const gasPrice = BigInt(feeData.gasPrice);
      return {
        slow: weiToGwei(gasPrice * 9n / 10n),
        average: weiToGwei(gasPrice),
        fast: weiToGwei(gasPrice * 11n / 10n),
        timestamp: Date.now(),
      };
    }

    // EIP-1559 network
    const feeHistory = await getFeeHistory(provider);
    const slow = calculateEIP1559Fees(feeHistory, 'slow');
    const average = calculateEIP1559Fees(feeHistory, 'average');
    const fast = calculateEIP1559Fees(feeHistory, 'fast');

    return {
      slow: weiToGwei(BigInt(slow.maxFeePerGas)),
      average: weiToGwei(BigInt(average.maxFeePerGas)),
      fast: weiToGwei(BigInt(fast.maxFeePerGas)),
      timestamp: Date.now(),
    };
  } catch (error) {
    throw new Error(`Failed to get gas prices: ${error}`);
  }
}

/**
 * Estimate transaction cost
 */
export function estimateTransactionCost(
  gasLimit: string | bigint,
  gasPrice: string | bigint
): string {
  const gasLimitBig = typeof gasLimit === 'string' ? BigInt(gasLimit) : gasLimit;
  const gasPriceBig = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
  const costWei = gasLimitBig * gasPriceBig;
  return fromWei(costWei, 18);
}

/**
 * Suggest gas limit with buffer
 */
export function suggestGasLimit(estimatedGas: string | bigint, buffer: number = 1.2): string {
  const estimated = typeof estimatedGas === 'string' ? BigInt(estimatedGas) : estimatedGas;
  const buffered = (estimated * BigInt(Math.floor(buffer * 100))) / 100n;
  return buffered.toString();
}

/**
 * Check if network supports EIP-1559
 */
export async function supportsEIP1559(provider: any): Promise<boolean> {
  try {
    const feeData = await provider.getFeeData();
    return feeData.maxFeePerGas !== undefined && feeData.maxPriorityFeePerGas !== undefined;
  } catch {
    return false;
  }
}
