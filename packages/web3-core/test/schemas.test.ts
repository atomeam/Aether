/**
 * Tests for Zod schemas
 */

import { describe, it, expect } from 'vitest';
import {
  addressSchema,
  txHashSchema,
  chainIdSchema,
  walletStateSchema,
  transactionSchema,
  gasEstimateSchema,
  contractInterfaceSchema,
  tokenInfoSchema,
  erc20TransferParamsSchema,
} from '../src/schemas';

describe('Zod Schemas', () => {
  describe('addressSchema', () => {
    it('should validate correct addresses', () => {
      expect(() => addressSchema.parse('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).not.toThrow();
      expect(() => addressSchema.parse('0x0000000000000000000000000000000000000000')).not.toThrow();
    });

    it('should reject invalid addresses', () => {
      expect(() => addressSchema.parse('0x742d35Cc6634C0532925a3b844Bc454e4438f44')).toThrow();
      expect(() => addressSchema.parse('742d35Cc6634C0532925a3b844Bc454e4438f44e')).toThrow();
      expect(() => addressSchema.parse('')).toThrow();
    });
  });

  describe('txHashSchema', () => {
    it('should validate correct transaction hashes', () => {
      expect(() =>
        txHashSchema.parse('0x742d35Cc6634C0532925a3b844Bc454e4438f44e742d35Cc6634C0532925a3b844Bc454e4438f44e')
      ).not.toThrow();
    });

    it('should reject invalid transaction hashes', () => {
      expect(() => txHashSchema.parse('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toThrow();
      expect(() => txHashSchema.parse('')).toThrow();
    });
  });

  describe('chainIdSchema', () => {
    it('should validate correct chain IDs', () => {
      expect(() => chainIdSchema.parse(1)).not.toThrow();
      expect(() => chainIdSchema.parse(137)).not.toThrow();
      expect(() => chainIdSchema.parse(42161)).not.toThrow();
    });

    it('should reject invalid chain IDs', () => {
      expect(() => chainIdSchema.parse(-1)).toThrow();
      expect(() => chainIdSchema.parse(0)).toThrow();
      expect(() => chainIdSchema.parse(1.5)).toThrow();
    });
  });

  describe('walletStateSchema', () => {
    it('should validate connected wallet state', () => {
      const state = {
        status: 'connected' as const,
        provider: 'metamask' as const,
        account: {
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
          chainId: 1,
          balance: '1000000000000000000',
        },
      };
      expect(() => walletStateSchema.parse(state)).not.toThrow();
    });

    it('should validate disconnected wallet state', () => {
      const state = {
        status: 'disconnected' as const,
      };
      expect(() => walletStateSchema.parse(state)).not.toThrow();
    });

    it('should validate error wallet state', () => {
      const state = {
        status: 'error' as const,
        error: 'Connection failed',
      };
      expect(() => walletStateSchema.parse(state)).not.toThrow();
    });
  });

  describe('transactionSchema', () => {
    it('should validate legacy transaction', () => {
      const tx = {
        type: 'legacy' as const,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        value: '1000000000000000000',
        gasPrice: '20000000000',
        gasLimit: '21000',
      };
      expect(() => transactionSchema.parse(tx)).not.toThrow();
    });

    it('should validate EIP-1559 transaction', () => {
      const tx = {
        type: 'eip1559' as const,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        value: '1000000000000000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        gasLimit: '21000',
      };
      expect(() => transactionSchema.parse(tx)).not.toThrow();
    });

    it('should validate EIP-2930 transaction', () => {
      const tx = {
        type: 'eip2930' as const,
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        value: '1000000000000000000',
        gasPrice: '20000000000',
        gasLimit: '21000',
        accessList: [
          {
            address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
            storageKeys: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
          },
        ],
      };
      expect(() => transactionSchema.parse(tx)).not.toThrow();
    });
  });

  describe('gasEstimateSchema', () => {
    it('should validate gas estimate', () => {
      const estimate = {
        gasLimit: '21000',
        gasPrice: '20000000000',
        estimatedCost: '0.00042',
      };
      expect(() => gasEstimateSchema.parse(estimate)).not.toThrow();
    });

    it('should validate EIP-1559 gas estimate', () => {
      const estimate = {
        gasLimit: '21000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000',
        estimatedCost: '0.00063',
      };
      expect(() => gasEstimateSchema.parse(estimate)).not.toThrow();
    });
  });

  describe('contractInterfaceSchema', () => {
    it('should validate contract interface', () => {
      const contractInterface = {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        abi: [
          {
            type: 'function' as const,
            name: 'balanceOf',
            inputs: [
              {
                name: 'account',
                type: 'address',
              },
            ],
            outputs: [
              {
                name: '',
                type: 'uint256',
              },
            ],
            stateMutability: 'view' as const,
          },
        ],
      };
      expect(() => contractInterfaceSchema.parse(contractInterface)).not.toThrow();
    });
  });

  describe('tokenInfoSchema', () => {
    it('should validate token info', () => {
      const tokenInfo = {
        address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        totalSupply: '1000000000000000000000000000',
      };
      expect(() => tokenInfoSchema.parse(tokenInfo)).not.toThrow();
    });
  });

  describe('erc20TransferParamsSchema', () => {
    it('should validate ERC20 transfer params', () => {
      const params = {
        to: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' as const,
        amount: '1000000000000000000',
      };
      expect(() => erc20TransferParamsSchema.parse(params)).not.toThrow();
    });
  });
});
