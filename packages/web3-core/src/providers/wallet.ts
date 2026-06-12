/**
 * Wallet Provider
 * Wallet connection and management for Ethereum
 */

import { ethers } from 'ethers';
import {
  WalletState,
  WalletStatus,
  WalletProvider,
  WalletAccount,
  Address,
  ChainId,
  Signature,
  PersonalMessage,
  TypedData,
} from '../types';

/**
 * Wallet provider class
 */
export class WalletProvider {
  private state: WalletState = {
    status: WalletStatus.Disconnected,
  };
  private ethersProvider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Initialize wallet provider
   */
  async initialize(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('Wallet provider only works in browser environment');
    }

    // Check for injected provider (MetaMask, etc.)
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found. Please install MetaMask or another wallet.');
    }

    this.ethersProvider = new ethers.BrowserProvider(window.ethereum);
  }

  /**
   * Connect wallet
   */
  async connect(): Promise<WalletAccount> {
    try {
      this.state.status = WalletStatus.Connecting;
      this.emit('statusChange', this.state);

      if (!this.ethersProvider) {
        await this.initialize();
      }

      const accounts = await this.ethersProvider!.send('eth_requestAccounts', []);
      const signer = await this.ethersProvider!.getSigner();
      this.signer = signer;

      const address = await signer.getAddress();
      const balance = await this.ethersProvider!.getBalance(address);
      const network = await this.ethersProvider!.getNetwork();

      this.state.account = {
        address: address as Address,
        chainId: Number(network.chainId) as ChainId,
        balance: balance.toString(),
      };

      this.state.status = WalletStatus.Connected;
      this.state.provider = this.detectWalletProvider();

      this.emit('statusChange', this.state);
      this.emit('accountChange', this.state.account);

      return this.state.account;
    } catch (error) {
      this.state.status = WalletStatus.Error;
      this.state.error = error instanceof Error ? error.message : 'Failed to connect wallet';
      this.emit('statusChange', this.state);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    this.state = {
      status: WalletStatus.Disconnected,
    };
    this.signer = null;
    this.emit('statusChange', this.state);
    this.emit('accountChange', null);
  }

  /**
   * Get current wallet state
   */
  getState(): WalletState {
    return { ...this.state };
  }

  /**
   * Get current account
   */
  getAccount(): WalletAccount | undefined {
    return this.state.account;
  }

  /**
   * Get signer
   */
  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  /**
   * Sign a personal message
   */
  async signMessage(message: PersonalMessage): Promise<Signature> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const signature = await this.signer.signMessage(message.message);
    const ethersSignature = ethers.Signature.from(signature);

    return {
      r: ethersSignature.r,
      s: ethersSignature.s,
      v: ethersSignature.v,
      signature,
    };
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(typedData: TypedData): Promise<Signature> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    const signature = await this.signer.signTypedData(
      typedData.domain,
      typedData.types,
      typedData.message
    );
    const ethersSignature = ethers.Signature.from(signature);

    return {
      r: ethersSignature.r,
      s: ethersSignature.s,
      v: ethersSignature.v,
      signature,
    };
  }

  /**
   * Sign transaction
   */
  async signTransaction(transaction: any): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    return await this.signer.signTransaction(transaction);
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: any): Promise<any> {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    return await this.signer.sendTransaction(transaction);
  }

  /**
   * Switch chain
   */
  async switchChain(chainId: ChainId): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      // Update account info after chain switch
      if (this.state.account) {
        const balance = await this.ethersProvider!.getBalance(this.state.account.address);
        this.state.account.chainId = chainId;
        this.state.account.balance = balance.toString();
        this.emit('accountChange', this.state.account);
      }
    } catch (error: any) {
      // Chain might not be added, try to add it
      if (error.code === 4902) {
        throw new Error('Chain not added to wallet. Please add it first.');
      }
      throw error;
    }
  }

  /**
   * Add chain to wallet
   */
  async addChain(chainConfig: {
    chainId: ChainId;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    rpcUrls: string[];
    blockExplorerUrls?: string[];
  }): Promise<void> {
    if (!window.ethereum) {
      throw new Error('No Ethereum wallet found');
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: `0x${chainConfig.chainId.toString(16)}`,
          chainName: chainConfig.chainName,
          nativeCurrency: chainConfig.nativeCurrency,
          rpcUrls: chainConfig.rpcUrls,
          blockExplorerUrls: chainConfig.blockExplorerUrls,
        },
      ],
    });
  }

  /**
   * Watch for account changes
   */
  onAccountChange(callback: (account: WalletAccount | null) => void): void {
    this.on('accountChange', callback);

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnect();
        } else if (this.state.account?.address !== accounts[0]) {
          this.connect().catch(console.error);
        }
      });
    }
  }

  /**
   * Watch for chain changes
   */
  onChainChange(callback: (chainId: ChainId) => void): void {
    this.on('chainChange', callback);

    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId: string) => {
        const id = parseInt(chainId, 16) as ChainId;
        if (this.state.account) {
          this.state.account.chainId = id;
          this.emit('chainChange', id);
        }
      });
    }
  }

  /**
   * Detect wallet provider type
   */
  private detectWalletProvider(): WalletProvider {
    if (!window.ethereum) {
      return WalletProvider.Injected;
    }

    if (window.ethereum.isMetaMask) {
      return WalletProvider.MetaMask;
    }

    if (window.ethereum.isCoinbaseWallet) {
      return WalletProvider.Coinbase;
    }

    if (window.ethereum.isBraveWallet) {
      return WalletProvider.Brave;
    }

    return WalletProvider.Injected;
  }

  /**
   * Event emitter
   */
  private on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Remove event listener
   */
  private off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
}

/**
 * Create a new wallet provider
 */
export function createWalletProvider(): WalletProvider {
  return new WalletProvider();
}
