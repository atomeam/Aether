/**
 * Web3 Core Types
 * TypeScript types for Ethereum blockchain interactions
 */

/**
 * Ethereum address (0x followed by 40 hex characters)
 */
export type Address = `0x${string}`;

/**
 * Transaction hash (0x followed by 64 hex characters)
 */
export type TxHash = `0x${string}`;

/**
 * Block hash (0x followed by 64 hex characters)
 */
export type BlockHash = `0x${string}`;

/**
 * 32-byte hash
 */
export type Hash32 = `0x${string}`;

/**
 * 256-bit unsigned integer
 */
export type Uint256 = bigint;

/**
 * 128-bit unsigned integer
 */
export type Uint128 = bigint;

/**
 * Ethereum network/chain ID
 */
export type ChainId = number;

/**
 * Supported Ethereum networks
 */
export enum Network {
  Mainnet = 1,
  Goerli = 5,
  Sepolia = 11155111,
  Polygon = 137,
  PolygonMumbai = 80001,
  Arbitrum = 42161,
  ArbitrumGoerli = 421613,
  Optimism = 10,
  OptimismGoerli = 420,
  BSC = 56,
  BSCTestnet = 97,
  Avalanche = 43114,
  AvalancheFuji = 43113,
  Base = 8453,
  BaseGoerli = 84531,
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: ChainId;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Wallet connection status
 */
export enum WalletStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

/**
 * Wallet provider types
 */
export enum WalletProvider {
  MetaMask = 'metamask',
  WalletConnect = 'walletconnect',
  Coinbase = 'coinbase',
  Brave = 'brave',
  Injected = 'injected',
}

/**
 * Wallet account information
 */
export interface WalletAccount {
  address: Address;
  chainId: ChainId;
  balance: string;
}

/**
 * Wallet state
 */
export interface WalletState {
  status: WalletStatus;
  provider?: WalletProvider;
  account?: WalletAccount;
  error?: string;
}

/**
 * Transaction types
 */
export enum TransactionType {
  Legacy = 'legacy',
  EIP2930 = 'eip2930',
  EIP1559 = 'eip1559',
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
  Replaced = 'replaced',
}

/**
 * Base transaction fields
 */
export interface BaseTransaction {
  to?: Address;
  value?: string;
  data?: string;
  nonce?: number;
  chainId?: ChainId;
}

/**
 * Legacy transaction (pre-EIP-1559)
 */
export interface LegacyTransaction extends BaseTransaction {
  type: TransactionType.Legacy;
  gasPrice?: string;
  gasLimit?: string;
}

/**
 * EIP-2930 transaction (with access list)
 */
export interface EIP2930Transaction extends BaseTransaction {
  type: TransactionType.EIP2930;
  gasPrice?: string;
  gasLimit?: string;
  accessList?: AccessList;
}

/**
 * EIP-1559 transaction (with fee market)
 */
export interface EIP1559Transaction extends BaseTransaction {
  type: TransactionType.EIP1559;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasLimit?: string;
  accessList?: AccessList;
}

/**
 * Union type for all transaction types
 */
export type Transaction = LegacyTransaction | EIP2930Transaction | EIP1559Transaction;

/**
 * Access list entry
 */
export interface AccessListEntry {
  address: Address;
  storageKeys: string[];
}

/**
 * Access list
 */
export type AccessList = AccessListEntry[];

/**
 * Signed transaction
 */
export interface SignedTransaction extends Transaction {
  hash: TxHash;
  from: Address;
}

/**
 * Transaction receipt
 */
export interface TransactionReceipt {
  transactionHash: TxHash;
  transactionIndex: number;
  blockHash: BlockHash;
  blockNumber: number;
  from: Address;
  to?: Address;
  cumulativeGasUsed: string;
  gasUsed: string;
  contractAddress?: Address;
  logs: Log[];
  status: TransactionStatus;
  logsBloom: string;
  effectiveGasPrice: string;
}

/**
 * Log entry
 */
export interface Log {
  address: Address;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: TxHash;
  transactionIndex: number;
  blockHash: BlockHash;
  logIndex: number;
  removed?: boolean;
}

/**
 * Block information
 */
export interface Block {
  number: number;
  hash: BlockHash;
  parentHash: BlockHash;
  nonce?: string;
  sha3Uncles?: string;
  logsBloom?: string;
  transactionsRoot: string;
  stateRoot: string;
  receiptsRoot: string;
  miner?: Address;
  difficulty?: string;
  totalDifficulty?: string;
  extraData: string;
  size: number;
  gasLimit: string;
  gasUsed: string;
  timestamp: number;
  transactions: TxHash[] | Transaction[];
  baseFeePerGas?: string;
}

/**
 * Gas estimation result
 */
export interface GasEstimate {
  gasLimit: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  estimatedCost: string;
}

/**
 * Smart contract ABI item
 */
export interface ABIItem {
  type: 'function' | 'event' | 'error' | 'constructor' | 'fallback' | 'receive';
  name?: string;
  inputs?: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  anonymous?: boolean;
}

/**
 * ABI parameter
 */
export interface ABIParameter {
  name: string;
  type: string;
  components?: ABIParameter[];
  indexed?: boolean;
}

/**
 * Smart contract interface
 */
export interface ContractInterface {
  address: Address;
  abi: ABIItem[];
}

/**
 * Contract call options
 */
export interface ContractCallOptions {
  from?: Address;
  value?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

/**
 * Contract call result
 */
export interface ContractCallResult<T = unknown> {
  data: T;
  success: boolean;
  error?: string;
}

/**
 * Contract write transaction
 */
export interface ContractWriteTransaction {
  contractAddress: Address;
  abi: ABIItem[];
  functionName: string;
  args: unknown[];
  options?: ContractCallOptions;
}

/**
 * Contract read call
 */
export interface ContractReadCall {
  contractAddress: Address;
  abi: ABIItem[];
  functionName: string;
  args: unknown[];
  options?: ContractCallOptions;
}

/**
 * Event filter
 */
export interface EventFilter {
  address?: Address;
  topics?: (string | string[] | null)[];
  fromBlock?: number | BlockTag;
  toBlock?: number | BlockTag;
}

/**
 * Block tag
 */
export type BlockTag = 'latest' | 'earliest' | 'pending' | 'safe' | 'finalized';

/**
 * Event log
 */
export interface EventLog extends Log {
  args?: Record<string, unknown>;
  event?: string;
  eventSignature?: string;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  rpcUrl?: string;
  chainId?: ChainId;
  timeout?: number;
  retries?: number;
}

/**
 * Signer configuration
 */
export interface SignerConfig {
  privateKey?: string;
  mnemonic?: string;
  derivationPath?: string;
}

/**
 * Message types for signing
 */
export enum MessageType {
  Personal = 'personal',
  TypedData = 'typedData',
  Transaction = 'transaction',
}

/**
 * Personal message
 */
export interface PersonalMessage {
  message: string;
}

/**
 * Typed data (EIP-712)
 */
export interface TypedData {
  types: Record<string, Array<{ name: string; type: string }>>;
  primaryType: string;
  domain: {
    name?: string;
    version?: string;
    chainId?: ChainId;
    verifyingContract?: Address;
    salt?: string;
  };
  message: Record<string, unknown>;
}

/**
 * Signature
 */
export interface Signature {
  r: string;
  s: string;
  v: number;
  signature: string;
}

/**
 * Fee history
 */
export interface FeeHistory {
  oldestBlock: number;
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  reward: string[][];
}

/**
 * Gas price
 */
export interface GasPrice {
  slow: string;
  average: string;
  fast: string;
  timestamp: number;
}

/**
 * Token information
 */
export interface TokenInfo {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: string;
}

/**
 * Token balance
 */
export interface TokenBalance {
  address: Address;
  balance: string;
  formatted: string;
}

/**
 * ERC20 transfer parameters
 */
export interface ERC20TransferParams {
  to: Address;
  amount: string;
}

/**
 * ERC20 approval parameters
 */
export interface ERC20ApprovalParams {
  spender: Address;
  amount: string;
}
