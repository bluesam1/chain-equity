/**
 * Deployment block detection utilities
 * Provides functions to get contract deployment block number
 */

import { ethers } from 'ethers';
import type { ChainEquityToken } from '../../../contracts/typechain-types/src/ChainEquityToken.js';
import { getProvider } from './provider.js';

// Cache for deployment block
const deploymentBlockCache = new Map<string, number>();

/**
 * Get the deployment block number for a contract
 * @param contractAddress - The contract address
 * @param provider - Optional provider instance
 * @returns The block number where the contract was deployed
 */
export async function getDeploymentBlock(
  contractAddress: string,
  provider?: ethers.Provider
): Promise<number> {
  // Check cache first
  if (deploymentBlockCache.has(contractAddress)) {
    return deploymentBlockCache.get(contractAddress)!;
  }

  try {
    const prov = provider || getProvider();
    
    // Get contract creation transaction
    const code = await prov.getCode(contractAddress);
    if (code === '0x') {
      throw new Error(`No contract found at address ${contractAddress}`);
    }

    // Get the contract creation transaction hash
    // We need to find the transaction that created this contract
    // This is a simplified approach - in production, you might want to use
    // a contract registry or store the deployment block during deployment
    
    // Alternative: Query the contract's first event to find deployment block
    // For now, we'll use a provider method to get the contract creation transaction
    const txHash = await getContractCreationTxHash(contractAddress, prov);
    
    if (!txHash) {
      throw new Error(`Could not find deployment transaction for ${contractAddress}`);
    }

    const tx = await prov.getTransaction(txHash);
    if (!tx) {
      throw new Error(`Transaction ${txHash} not found`);
    }

    const receipt = await prov.getTransactionReceipt(txHash);
    if (!receipt) {
      throw new Error(`Transaction receipt for ${txHash} not found`);
    }

    const blockNumber = receipt.blockNumber;
    
    // Cache the result
    deploymentBlockCache.set(contractAddress, blockNumber);
    
    return blockNumber;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to get deployment block: ${error.message}`);
    }
    throw new Error(`Failed to get deployment block: ${String(error)}`);
  }
}

/**
 * Get the contract creation transaction hash
 * This is a helper function that attempts to find the contract creation transaction
 * @param _contractAddress - The contract address
 * @param _provider - The provider instance
 * @returns The transaction hash that created the contract, or null if not found
 */
async function getContractCreationTxHash(
  _contractAddress: string,
  _provider: ethers.Provider
): Promise<string | null> {
  // Try to get from provider if it supports it
  // Some providers have a method to get contract creation transaction
  // For now, we'll use a workaround: query events from earliest block
  
  // Alternative approach: Use a contract instance to query first event
  // This is more reliable but requires the contract ABI
  // For now, we'll return null and let the caller handle it
  // In a real implementation, you might want to:
  // 1. Store deployment block during deployment
  // 2. Use a contract registry
  // 3. Query from a known earliest block
  
  return null;
}

/**
 * Get deployment block using contract events as fallback
 * Queries the contract's first event to determine deployment block
 * @param contract - The contract instance
 * @param provider - The provider instance
 * @returns The deployment block number
 */
export async function getDeploymentBlockFromEvents(
  contract: ChainEquityToken,
  provider: ethers.Provider
): Promise<number> {
  try {
    // Query Transfer events from earliest block
    // The first event should be close to deployment
    const filter = contract.filters.Transfer();
    const events = await contract.queryFilter(filter, 0, 'latest');
    
    if (events.length === 0) {
      // No events yet, try to get from contract code
      const contractAddress = await contract.getAddress();
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        throw new Error(`No contract found at address ${contractAddress}`);
      }
      
      // If no events, we can't determine deployment block from events
      // Return 0 as fallback (will query from genesis)
      return 0;
    }
    
    // Get the block number of the first event
    const firstEvent = events[0];
    return firstEvent.blockNumber;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to get deployment block from events: ${error.message}`);
    }
    throw new Error(`Failed to get deployment block from events: ${String(error)}`);
  }
}

