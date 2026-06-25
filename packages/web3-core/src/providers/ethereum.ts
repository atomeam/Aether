/**
 * Ethereum Provider
 * Core provider implementation for Ethereum blockchain interactions
 */

import { ethers } from 'ethers';
import {
  ProviderConfig,
  NetworkConfig,
  Block,
  TransactionReceipt,
  FeeHistory,
  Address,
  ChainId,
} from '../types';
import { estimateGas, getFeeHistory, getGasPrices, supportsEIP1559 } from '../utils/gas';

/**
 * Ethereum provider class
 */
export class EthereumProvider {
  private provider: ethers.JsonRpcProvider;
  private config: ProviderConfig;

  constructor(config: ProviderConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    if (this.config.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    } else {
      // Default to public endpoint (should be configured in production)
      this.provider = new ethers.JsonRpcProvider(
        'https://eth-mainnet.g.alchemy.com/v2/demo'
      );
    }
  }

  /**
   * Get the underlying ethers provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }

  /**
   * Get network/chain information
   */
  async getNetwork(): Promise<{ chainId: ChainId; name: string }> {
    const network = await this.provider.getNetwork();
    return {
      chainId: Number(network.chainId),
      name: network.name,
    };
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  /**
   * Get block by number
   */
  async getBlock(blockNumber: number | 'latest' | 'earliest' = 'latest'): Promise<Block> {
    const block = await this.provider.getBlock(blockNumber);
    if (!block) {
      throw new Error('Block not found');
    }

    return {
      number: block.number,
      hash: block.hash as `0x${string}`,
      parentHash: block.parentHash as `0x${string}`,
      nonce: block.nonce,
      sha3Uncles: block.sha3Uncles,
      logsBloom: block.logsBloom,
      transactionsRoot: block.transactionsRoot,
      stateRoot: block.stateRoot,
      receiptsRoot: block.receiptsRoot,
      miner: block.miner as Address | undefined,
      difficulty: block.difficulty?.toString(),
      totalDifficulty: block.totalDifficulty?.toString(),
      extraData: block.extraData,
      size: block.size,
      gasLimit: block.gasLimit.toString(),
      gasUsed: block.gasUsed.toString(),
      timestamp: block.timestamp,
      transactions: block.transactions.map((tx) => tx),
      baseFeePerGas: block.baseFeePerGas?.toString(),
    };
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return null;
    }

    return {
      transactionHash: receipt.hash as `0x${string}`,
      transactionIndex: receipt.index,
      blockHash: receipt.blockHash as `0x${string}`,
      blockNumber: receipt.blockNumber,
      from: receipt.from as Address,
      to: receipt.to as Address | undefined,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.contractAddress as Address | undefined,
      logs: receipt.logs,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      logsBloom: receipt.logsBloom,
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    };
  }

  /**
   * Get account balance
   */
  async getBalance(address: Address): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return balance.toString();
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(address: Address): Promise<number> {
    return await this.provider.getTransactionCount(address);
  }

  /**
   * Send raw transaction
   */
  async sendRawTransaction(signedTx: string): Promise<string> {
    return await this.provider.broadcastTransaction(signedTx);
  }

  /**
   * Call a contract (read-only)
   */
  async call(transaction: any): Promise<string> {
    return await this.provider.call(transaction);
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(transaction: any): Promise<any> {
    return await estimateGas(transaction, this.provider);
  }

  /**
   * Get fee history
   */
  async getFeeHistory(
    blockCount: number = 4,
    rewardPercentiles: number[] = [25, 50, 75]
  ): Promise<FeeHistory> {
    return await getFeeHistory(this.provider, blockCount, rewardPercentiles);
  }

  /**
   * Get gas prices
   */
  async getGasPrices(): Promise<any> {
    return await getGasPrices(this.provider);
  }

  /**
   * Check if network supports EIP-1559
   */
  async supportsEIP1559(): Promise<boolean> {
    return await supportsEIP1559(this.provider);
  }

  /**
   * Get code at address
   */
  async getCode(address: Address): Promise<string> {
    return await this.provider.getCode(address);
  }

  /**
   * Get storage at address
   */
  async getStorageAt(address: Address, position: string): Promise<string> {
    return await this.provider.getStorage(address, position);
  }

  /**
   * Wait for transaction to be mined
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 60000
  ): Promise<TransactionReceipt> {
    const receipt = await this.provider.waitForTransaction(txHash, confirmations, timeout);
    if (!receipt) {
      throw new Error('Transaction not found');
    }

    return {
      transactionHash: receipt.hash as `0x${string}`,
      transactionIndex: receipt.index,
      blockHash: receipt.blockHash as `0x${string}`,
      blockNumber: receipt.blockNumber,
      from: receipt.from as Address,
      to: receipt.to as Address | undefined,
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.contractAddress as Address | undefined,
      logs: receipt.logs,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      logsBloom: receipt.logsBloom,
      effectiveGasPrice: receipt.effectiveGasPrice.toString(),
    };
  }

  /**
   * Disconnect provider
   */
  async disconnect(): Promise<void> {
    // ethers.js providers don't have a disconnect method
    // This is a placeholder for cleanup
  }
}

/**
 * Create a new Ethereum provider
 */
export function createEthereumProvider(config?: ProviderConfig): EthereumProvider {
  return new EthereumProvider(config);
}
