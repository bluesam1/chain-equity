/**
 * Blockchain provider utility
 * Provides ethers.js provider instances for blockchain connections
 */

import { ethers } from 'ethers';

/**
 * Get an ethers.js provider instance
 * Supports both local and remote blockchain connections via RPC URL
 * @param rpcUrl - Optional RPC URL (defaults to RPC_URL env var or localhost)
 * @returns Provider instance
 */
export function getProvider(rpcUrl?: string): ethers.Provider {
  const url = rpcUrl || process.env.RPC_URL || 'http://localhost:8545';
  return new ethers.JsonRpcProvider(url);
}

