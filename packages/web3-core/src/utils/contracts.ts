/**
 * Contract Utilities
 * Helper functions for smart contract interactions
 */

import { ethers } from 'ethers';
import {
  ContractInterface,
  ContractCallOptions,
  ContractCallResult,
  ContractWriteTransaction,
  ContractReadCall,
  Address,
  ABIItem,
} from '../types';

/**
 * Create a contract instance
 */
export function createContract(
  contractInterface: ContractInterface,
  providerOrSigner: ethers.Provider | ethers.Signer
): ethers.Contract {
  return new ethers.Contract(
    contractInterface.address,
    contractInterface.abi,
    providerOrSigner
  );
}

/**
 * Read from a contract
 */
export async function readContract<T = unknown>(
  call: ContractReadCall,
  provider: ethers.Provider
): Promise<ContractCallResult<T>> {
  try {
    const contract = createContract(
      {
        address: call.contractAddress,
        abi: call.abi,
      },
      provider
    );

    const data = await contract[call.functionName](...call.args);

    return {
      data: data as T,
      success: true,
    };
  } catch (error) {
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Contract read failed',
    };
  }
}

/**
 * Write to a contract
 */
export async function writeContract(
  transaction: ContractWriteTransaction,
  signer: ethers.Signer
): Promise<ethers.ContractTransactionResponse> {
  const contract = createContract(
    {
      address: transaction.contractAddress,
      abi: transaction.abi,
    },
    signer
  );

  const options: any = {};
  if (transaction.options) {
    if (transaction.options.value) {
      options.value = ethers.parseEther(transaction.options.value);
    }
    if (transaction.options.gasLimit) {
      options.gasLimit = transaction.options.gasLimit;
    }
    if (transaction.options.gasPrice) {
      options.gasPrice = transaction.options.gasPrice;
    }
    if (transaction.options.maxFeePerGas) {
      options.maxFeePerGas = transaction.options.maxFeePerGas;
    }
    if (transaction.options.maxPriorityFeePerGas) {
      options.maxPriorityFeePerGas = transaction.options.maxPriorityFeePerGas;
    }
  }

  return await contract[transaction.functionName](...transaction.args, options);
}

/**
 * Estimate gas for contract call
 */
export async function estimateContractGas(
  transaction: ContractWriteTransaction,
  provider: ethers.Provider
): Promise<string> {
  const contract = createContract(
    {
      address: transaction.contractAddress,
      abi: transaction.abi,
    },
    provider
  );

  const options: any = {};
  if (transaction.options) {
    if (transaction.options.value) {
      options.value = ethers.parseEther(transaction.options.value);
    }
    if (transaction.options.from) {
      options.from = transaction.options.from;
    }
  }

  const gasEstimate = await contract[transaction.functionName].estimateGas(
    ...transaction.args,
    options
  );

  return gasEstimate.toString();
}

/**
 * Get contract events
 */
export async function getContractEvents(
  contractInterface: ContractInterface,
  eventName: string,
  provider: ethers.Provider,
  fromBlock?: number,
  toBlock?: number
): Promise<any[]> {
  const contract = createContract(contractInterface, provider);
  const filter = contract.filters[eventName]();

  const events = await contract.queryFilter(filter, fromBlock, toBlock);
  return events;
}

/**
 * Listen to contract events
 */
export function listenToContractEvent(
  contractInterface: ContractInterface,
  eventName: string,
  provider: ethers.Provider,
  callback: (event: any) => void
): () => void {
  const contract = createContract(contractInterface, provider);

  contract.on(eventName, (...args: any[]) => {
    const event = args[args.length - 1]; // Last arg is the event object
    callback(event);
  });

  // Return unsubscribe function
  return () => {
    contract.off(eventName, callback);
  };
}

/**
 * Parse contract ABI
 */
export function parseABI(abi: any[]): ABIItem[] {
  return abi as ABIItem[];
}

/**
 * Encode function call
 */
export function encodeFunctionCall(
  abi: ABIItem[],
  functionName: string,
  args: unknown[]
): string {
  const iface = new ethers.Interface(abi);
  return iface.encodeFunctionData(functionName, args);
}

/**
 * Decode function result
 */
export function decodeFunctionResult(
  abi: ABIItem[],
  functionName: string,
  data: string
): unknown {
  const iface = new ethers.Interface(abi);
  return iface.decodeFunctionResult(functionName, data);
}

/**
 * Decode event log
 */
export function decodeEventLog(
  abi: ABIItem[],
  eventName: string,
  log: { topics: string[]; data: string }
): any {
  const iface = new ethers.Interface(abi);
  return iface.decodeEventLog(eventName, log.data, log.topics);
}

/**
 * Get function selector
 */
export function getFunctionSelector(abi: ABIItem[], functionName: string): string {
  const iface = new ethers.Interface(abi);
  return iface.getFunction(functionName)!.selector;
}

/**
 * Check if address is a contract
 */
export async function isContract(address: Address, provider: ethers.Provider): Promise<boolean> {
  const code = await provider.getCode(address);
  return code !== '0x';
}

/**
 * Get contract bytecode
 */
export async function getContractBytecode(address: Address, provider: ethers.Provider): Promise<string> {
  return await provider.getCode(address);
}

/**
 * Deploy contract
 */
export async function deployContract(
  abi: ABIItem[],
  bytecode: string,
  args: unknown[],
  signer: ethers.Signer,
  options?: { value?: string; gasLimit?: string }
): Promise<ethers.Contract> {
  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  const deployOptions: any = {};
  if (options?.value) {
    deployOptions.value = ethers.parseEther(options.value);
  }
  if (options?.gasLimit) {
    deployOptions.gasLimit = options.gasLimit;
  }

  const contract = await factory.deploy(...args, deployOptions);
  return contract;
}

/**
 * Multicall - batch multiple contract reads
 */
export async function multicall(
  calls: Array<{
    target: Address;
    abi: ABIItem[];
    functionName: string;
    args: unknown[];
  }>,
  provider: ethers.Provider
): Promise<ContractCallResult[]> {
  const results = await Promise.all(
    calls.map((call) =>
      readContract(
        {
          contractAddress: call.target,
          abi: call.abi,
          functionName: call.functionName,
          args: call.args,
        },
        provider
      )
    )
  );

  return results;
}
