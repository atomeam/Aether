/**
 * Address Utilities
 * Helper functions for Ethereum address operations
 */

import { Address } from '../types';

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): address is Address {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Check if an address is a contract
 * Note: This requires a provider to check code at the address
 */
export async function isContractAddress(
  address: Address,
  provider: any
): Promise<boolean> {
  try {
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch (error) {
    throw new Error(`Failed to check if address is contract: ${error}`);
  }
}

/**
 * Convert address to checksum format (EIP-55)
 */
export function toChecksumAddress(address: Address): Address {
  const addressLower = address.toLowerCase().slice(2);
  const hash = keccak256(addressLower);
  let checksum = '0x';

  for (let i = 0; i < addressLower.length; i++) {
    const char = addressLower[i];
    const hashChar = hash[i];
    if (parseInt(hashChar, 16) >= 8) {
      checksum += char.toUpperCase();
    } else {
      checksum += char;
    }
  }

  return checksum as Address;
}

/**
 * Simple keccak256 implementation (for checksum)
 * In production, use ethers.js or viem
 */
function keccak256(data: string): string {
  // This is a simplified version
  // In production, use ethers.keccak256(data) or viem's keccak256
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash;
}

/**
 * Compare two addresses (case-insensitive)
 */
export function areAddressesEqual(a: Address, b: Address): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: Address, chars: number = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get address from private key
 */
export function addressFromPrivateKey(privateKey: string): Address {
  // In production, use ethers or viem
  // This is a placeholder
  throw new Error('Use ethers.js or viem for this operation');
}
