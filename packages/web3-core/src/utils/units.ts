/**
 * Unit Utilities
 * Helper functions for converting between ETH units and wei
 */

/**
 * Convert wei to ether
 */
export function fromWei(wei: string | bigint, decimals: number = 18): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;

  if (remainder === 0n) {
    return quotient.toString();
  }

  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmed = remainderStr.replace(/0+$/, '');
  return `${quotient}.${trimmed}`;
}

/**
 * Convert ether to wei
 */
export function toWei(ether: string, decimals: number = 18): bigint {
  const [integer, fraction = ''] = ether.split('.');

  const integerWei = BigInt(integer) * BigInt(10 ** decimals);
  const fractionWei = BigInt(fraction.padEnd(decimals, '0').slice(0, decimals));

  return integerWei + fractionWei;
}

/**
 * Format wei to human-readable string
 */
export function formatWei(wei: string | bigint, decimals: number = 2): string {
  const ether = fromWei(wei, 18);
  const [integer, fraction = ''] = ether.split('.');

  if (decimals === 0) {
    return integer;
  }

  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return `${integer}.${paddedFraction}`;
}

/**
 * Parse human-readable string to wei
 */
export function parseWei(value: string): bigint {
  return toWei(value, 18);
}

/**
 * Convert between different token decimals
 */
export function convertDecimals(
  amount: string | bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  const value = typeof amount === 'string' ? BigInt(amount) : amount;

  if (fromDecimals === toDecimals) {
    return value;
  }

  if (fromDecimals > toDecimals) {
    return value / BigInt(10 ** (fromDecimals - toDecimals));
  }

  return value * BigInt(10 ** (toDecimals - fromDecimals));
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(
  amount: string | bigint,
  tokenDecimals: number,
  displayDecimals: number = 4
): string {
  const normalized = fromWei(amount, tokenDecimals);
  const [integer, fraction = ''] = normalized.split('.');

  if (displayDecimals === 0) {
    return integer;
  }

  const paddedFraction = fraction.padEnd(displayDecimals, '0').slice(0, displayDecimals);
  return `${integer}.${paddedFraction}`;
}

/**
 * Parse token amount to smallest unit
 */
export function parseTokenAmount(amount: string, tokenDecimals: number): bigint {
  return toWei(amount, tokenDecimals);
}

/**
 * Calculate gas cost in ETH
 */
export function calculateGasCost(gasUsed: string | bigint, gasPrice: string | bigint): string {
  const gasUsedBig = typeof gasUsed === 'string' ? BigInt(gasUsed) : gasUsed;
  const gasPriceBig = typeof gasPrice === 'string' ? BigInt(gasPrice) : gasPrice;
  const costWei = gasUsedBig * gasPriceBig;
  return fromWei(costWei, 18);
}

/**
 * Format Gwei to wei
 */
export function gweiToWei(gwei: string | bigint): bigint {
  const value = typeof gwei === 'string' ? BigInt(gwei) : gwei;
  return value * BigInt(10 ** 9);
}

/**
 * Format wei to Gwei
 */
export function weiToGwei(wei: string | bigint): string {
  const value = typeof wei === 'string' ? BigInt(wei) : wei;
  return fromWei(value, 9);
}
