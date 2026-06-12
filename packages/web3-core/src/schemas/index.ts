/**
 * Web3 Core Zod Schemas
 * Validation schemas for Ethereum blockchain interactions
 */

import { z } from 'zod';

/**
 * Ethereum address validation (0x followed by 40 hex characters)
 */
export const addressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  .transform((val) => val as `0x${string}`);

/**
 * Transaction hash validation (0x followed by 64 hex characters)
 */
export const txHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')
  .transform((val) => val as `0x${string}`);

/**
 * Block hash validation
 */
export const blockHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid block hash')
  .transform((val) => val as `0x${string}`);

/**
 * 32-byte hash validation
 */
export const hash32Schema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid 32-byte hash')
  .transform((val) => val as `0x${string}`);

/**
 * Hex string validation
 */
export const hexStringSchema = z.string().regex(/^0x[a-fA-F0-9]*$/, 'Invalid hex string');

/**
 * Chain ID validation
 */
export const chainIdSchema = z.number().int().positive();

/**
 * Network enum
 */
export const networkSchema = z.enum([
  'Mainnet',
  'Goerli',
  'Sepolia',
  'Polygon',
  'PolygonMumbai',
  'Arbitrum',
  'ArbitrumGoerli',
  'Optimism',
  'OptimismGoerli',
  'BSC',
  'BSCTestnet',
  'Avalanche',
  'AvalancheFuji',
  'Base',
  'BaseGoerli',
]);

/**
 * Network configuration schema
 */
export const networkConfigSchema = z.object({
  chainId: chainIdSchema,
  name: z.string(),
  rpcUrl: z.string().url(),
  blockExplorerUrl: z.string().url(),
  nativeCurrency: z.object({
    name: z.string(),
    symbol: z.string(),
    decimals: z.number().int().nonnegative(),
  }),
});

/**
 * Wallet status enum
 */
export const walletStatusSchema = z.enum(['disconnected', 'connecting', 'connected', 'error']);

/**
 * Wallet provider enum
 */
export const walletProviderSchema = z.enum([
  'metamask',
  'walletconnect',
  'coinbase',
  'brave',
  'injected',
]);

/**
 * Wallet account schema
 */
export const walletAccountSchema = z.object({
  address: addressSchema,
  chainId: chainIdSchema,
  balance: z.string(),
});

/**
 * Wallet state schema
 */
export const walletStateSchema = z.object({
  status: walletStatusSchema,
  provider: walletProviderSchema.optional(),
  account: walletAccountSchema.optional(),
  error: z.string().optional(),
});

/**
 * Transaction type enum
 */
export const transactionTypeSchema = z.enum(['legacy', 'eip2930', 'eip1559']);

/**
 * Transaction status enum
 */
export const transactionStatusSchema = z.enum(['pending', 'confirmed', 'failed', 'replaced']);

/**
 * Access list entry schema
 */
export const accessListEntrySchema = z.object({
  address: addressSchema,
  storageKeys: z.array(hexStringSchema),
});

/**
 * Access list schema
 */
export const accessListSchema = z.array(accessListEntrySchema);

/**
 * Base transaction schema
 */
export const baseTransactionSchema = z.object({
  to: addressSchema.optional(),
  value: z.string().optional(),
  data: hexStringSchema.optional(),
  nonce: z.number().int().nonnegative().optional(),
  chainId: chainIdSchema.optional(),
});

/**
 * Legacy transaction schema
 */
export const legacyTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('legacy'),
  gasPrice: z.string().optional(),
  gasLimit: z.string().optional(),
});

/**
 * EIP-2930 transaction schema
 */
export const eip2930TransactionSchema = baseTransactionSchema.extend({
  type: z.literal('eip2930'),
  gasPrice: z.string().optional(),
  gasLimit: z.string().optional(),
  accessList: accessListSchema.optional(),
});

/**
 * EIP-1559 transaction schema
 */
export const eip1559TransactionSchema = baseTransactionSchema.extend({
  type: z.literal('eip1559'),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  gasLimit: z.string().optional(),
  accessList: accessListSchema.optional(),
});

/**
 * Transaction schema (union of all types)
 */
export const transactionSchema = z.discriminatedUnion('type', [
  legacyTransactionSchema,
  eip2930TransactionSchema,
  eip1559TransactionSchema,
]);

/**
 * Signed transaction schema
 */
export const signedTransactionSchema = transactionSchema.extend({
  hash: txHashSchema,
  from: addressSchema,
});

/**
 * Transaction receipt schema
 */
export const transactionReceiptSchema = z.object({
  transactionHash: txHashSchema,
  transactionIndex: z.number().int().nonnegative(),
  blockHash: blockHashSchema,
  blockNumber: z.number().int().nonnegative(),
  from: addressSchema,
  to: addressSchema.optional(),
  cumulativeGasUsed: z.string(),
  gasUsed: z.string(),
  contractAddress: addressSchema.optional(),
  logs: z.array(z.any()),
  status: transactionStatusSchema,
  logsBloom: z.string(),
  effectiveGasPrice: z.string(),
});

/**
 * Log entry schema
 */
export const logSchema = z.object({
  address: addressSchema,
  topics: z.array(z.string()),
  data: z.string(),
  blockNumber: z.number().int().nonnegative(),
  transactionHash: txHashSchema,
  transactionIndex: z.number().int().nonnegative(),
  blockHash: blockHashSchema,
  logIndex: z.number().int().nonnegative(),
  removed: z.boolean().optional(),
});

/**
 * Block schema
 */
export const blockSchema = z.object({
  number: z.number().int().nonnegative(),
  hash: blockHashSchema,
  parentHash: blockHashSchema,
  nonce: z.string().optional(),
  sha3Uncles: z.string().optional(),
  logsBloom: z.string().optional(),
  transactionsRoot: z.string(),
  stateRoot: z.string(),
  receiptsRoot: z.string(),
  miner: addressSchema.optional(),
  difficulty: z.string().optional(),
  totalDifficulty: z.string().optional(),
  extraData: z.string(),
  size: z.number().int().nonnegative(),
  gasLimit: z.string(),
  gasUsed: z.string(),
  timestamp: z.number().int().nonnegative(),
  transactions: z.union([z.array(txHashSchema), z.array(z.any())]),
  baseFeePerGas: z.string().optional(),
});

/**
 * Gas estimate schema
 */
export const gasEstimateSchema = z.object({
  gasLimit: z.string(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  estimatedCost: z.string(),
});

/**
 * ABI parameter schema
 */
export const abiParameterSchema = z.object({
  name: z.string(),
  type: z.string(),
  components: z.array(z.lazy(() => abiParameterSchema)).optional(),
  indexed: z.boolean().optional(),
});

/**
 * ABI item schema
 */
export const abiItemSchema = z.object({
  type: z.enum(['function', 'event', 'error', 'constructor', 'fallback', 'receive']),
  name: z.string().optional(),
  inputs: z.array(abiParameterSchema).optional(),
  outputs: z.array(abiParameterSchema).optional(),
  stateMutability: z.enum(['pure', 'view', 'nonpayable', 'payable']).optional(),
  anonymous: z.boolean().optional(),
});

/**
 * Contract interface schema
 */
export const contractInterfaceSchema = z.object({
  address: addressSchema,
  abi: z.array(abiItemSchema),
});

/**
 * Contract call options schema
 */
export const contractCallOptionsSchema = z.object({
  from: addressSchema.optional(),
  value: z.string().optional(),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
});

/**
 * Contract call result schema
 */
export const contractCallResultSchema = z.object({
  data: z.any(),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Contract write transaction schema
 */
export const contractWriteTransactionSchema = z.object({
  contractAddress: addressSchema,
  abi: z.array(abiItemSchema),
  functionName: z.string(),
  args: z.array(z.any()),
  options: contractCallOptionsSchema.optional(),
});

/**
 * Contract read call schema
 */
export const contractReadCallSchema = z.object({
  contractAddress: addressSchema,
  abi: z.array(abiItemSchema),
  functionName: z.string(),
  args: z.array(z.any()),
  options: contractCallOptionsSchema.optional(),
});

/**
 * Block tag schema
 */
export const blockTagSchema = z.enum(['latest', 'earliest', 'pending', 'safe', 'finalized']);

/**
 * Event filter schema
 */
export const eventFilterSchema = z.object({
  address: addressSchema.optional(),
  topics: z.array(z.union([z.string(), z.array(z.string()), z.null()])).optional(),
  fromBlock: z.union([z.number().int().nonnegative(), blockTagSchema]).optional(),
  toBlock: z.union([z.number().int().nonnegative(), blockTagSchema]).optional(),
});

/**
 * Provider configuration schema
 */
export const providerConfigSchema = z.object({
  rpcUrl: z.string().url().optional(),
  chainId: chainIdSchema.optional(),
  timeout: z.number().int().positive().optional(),
  retries: z.number().int().nonnegative().optional(),
});

/**
 * Signer configuration schema
 */
export const signerConfigSchema = z.object({
  privateKey: z.string().regex(/^0x[a-fA-F0-9]{64}$/).optional(),
  mnemonic: z.string().optional(),
  derivationPath: z.string().optional(),
});

/**
 * Message type enum
 */
export const messageTypeSchema = z.enum(['personal', 'typedData', 'transaction']);

/**
 * Personal message schema
 */
export const personalMessageSchema = z.object({
  message: z.string(),
});

/**
 * Typed data schema (EIP-712)
 */
export const typedDataSchema = z.object({
  types: z.record(
    z.array(
      z.object({
        name: z.string(),
        type: z.string(),
      })
    )
  ),
  primaryType: z.string(),
  domain: z.object({
    name: z.string().optional(),
    version: z.string().optional(),
    chainId: chainIdSchema.optional(),
    verifyingContract: addressSchema.optional(),
    salt: z.string().optional(),
  }),
  message: z.record(z.any()),
});

/**
 * Signature schema
 */
export const signatureSchema = z.object({
  r: z.string(),
  s: z.string(),
  v: z.number(),
  signature: z.string(),
});

/**
 * Fee history schema
 */
export const feeHistorySchema = z.object({
  oldestBlock: z.number().int().nonnegative(),
  baseFeePerGas: z.array(z.string()),
  gasUsedRatio: z.array(z.number()),
  reward: z.array(z.array(z.string())),
});

/**
 * Gas price schema
 */
export const gasPriceSchema = z.object({
  slow: z.string(),
  average: z.string(),
  fast: z.string(),
  timestamp: z.number().int().nonnegative(),
});

/**
 * Token information schema
 */
export const tokenInfoSchema = z.object({
  address: addressSchema,
  symbol: z.string(),
  name: z.string(),
  decimals: z.number().int().nonnegative(),
  totalSupply: z.string(),
});

/**
 * Token balance schema
 */
export const tokenBalanceSchema = z.object({
  address: addressSchema,
  balance: z.string(),
  formatted: z.string(),
});

/**
 * ERC20 transfer parameters schema
 */
export const erc20TransferParamsSchema = z.object({
  to: addressSchema,
  amount: z.string(),
});

/**
 * ERC20 approval parameters schema
 */
export const erc20ApprovalParamsSchema = z.object({
  spender: addressSchema,
  amount: z.string(),
});
