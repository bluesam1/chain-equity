/**
 * Block lookup utilities
 * Provides functions to find block numbers by timestamp and detect contract deployment blocks
 */

import { ethers, type Provider } from "ethers";
import { getContractAddress } from "./contract";

/**
 * Error thrown when the requested date/time is in the future
 */
export class FutureDateError extends Error {
  constructor() {
    super(
      "The selected date/time is in the future. Please select a past date."
    );
    this.name = "FutureDateError";
  }
}

/**
 * Error thrown when the requested date/time is before contract deployment
 */
export class BeforeDeploymentError extends Error {
  constructor() {
    super(
      "The selected date/time is before the contract was deployed. Please select a later date."
    );
    this.name = "BeforeDeploymentError";
  }
}

/**
 * Error thrown when contract deployment block cannot be found
 */
export class ContractNotFoundError extends Error {
  constructor() {
    super(
      "Contract deployment block could not be found. Please verify the contract address is correct."
    );
    this.name = "ContractNotFoundError";
  }
}

/**
 * Result of a block lookup operation
 */
export interface BlockLookupResult {
  blockNumber: number;
  timestamp: number;
}

/**
 * Progress callback for binary search operations
 * @param currentBlock - Current block being checked
 * @param minBlock - Minimum block in search range
 * @param maxBlock - Maximum block in search range
 */
export type ProgressCallback = (
  currentBlock: number,
  minBlock: number,
  maxBlock: number
) => void;

/**
 * Get the contract deployment block number by finding the first block where the contract code exists.
 * Uses binary search to efficiently find the deployment block.
 *
 * @param provider - The ethers.js provider instance
 * @param contractAddress - The contract address to find deployment block for
 * @param progressCallback - Optional callback to report progress during search
 * @returns The block number where the contract was deployed
 * @throws {ContractNotFoundError} If contract cannot be found at current block
 */
export async function getContractDeploymentBlock(
  provider: Provider,
  contractAddress: string,
  progressCallback?: ProgressCallback
): Promise<number> {
  // Get current block number
  const currentBlock = await provider.getBlockNumber();

  // Check if contract exists at current block
  const currentCode = await provider.getCode(contractAddress, currentBlock);
  if (!currentCode || currentCode === "0x") {
    throw new ContractNotFoundError();
  }

  // Binary search to find first block where contract exists
  let minBlock = 0;
  let maxBlock = currentBlock;
  let deploymentBlock = currentBlock;

  while (minBlock <= maxBlock) {
    const midBlock = Math.floor((minBlock + maxBlock) / 2);

    if (progressCallback) {
      progressCallback(midBlock, minBlock, maxBlock);
    }

    const code = await provider.getCode(contractAddress, midBlock);

    if (code && code !== "0x") {
      // Contract exists at this block, search earlier
      deploymentBlock = midBlock;
      maxBlock = midBlock - 1;
    } else {
      // Contract doesn't exist at this block, search later
      minBlock = midBlock + 1;
    }
  }

  return deploymentBlock;
}

/**
 * Find the latest block number with timestamp less than or equal to the target timestamp.
 * Uses binary search algorithm for O(log n) efficiency.
 *
 * @param provider - The ethers.js provider instance
 * @param targetTimestamp - Unix timestamp (seconds) to find block for
 * @param progressCallback - Optional callback to report progress during search
 * @returns Block lookup result with block number and timestamp
 * @throws {FutureDateError} If target timestamp is in the future
 * @throws {BeforeDeploymentError} If target timestamp is before contract deployment
 */
export async function findBlockByTimestamp(
  provider: Provider,
  targetTimestamp: number,
  progressCallback?: ProgressCallback
): Promise<BlockLookupResult> {
  // Get current block number and timestamp
  const currentBlock = await provider.getBlockNumber();
  const currentBlockData = await provider.getBlock(currentBlock);

  if (!currentBlockData) {
    throw new Error("Failed to get current block data");
  }

  const currentTimestamp = currentBlockData.timestamp;

  // Validate: check if target is in the future
  if (targetTimestamp > currentTimestamp) {
    throw new FutureDateError();
  }

  // Get contract deployment block
  const contractAddress = getContractAddress();
  const deploymentBlock = await getContractDeploymentBlock(
    provider,
    contractAddress,
    progressCallback
  );

  // Get deployment block timestamp
  const deploymentBlockData = await provider.getBlock(deploymentBlock);
  if (!deploymentBlockData) {
    throw new Error("Failed to get deployment block data");
  }

  const deploymentTimestamp = deploymentBlockData.timestamp;

  // Validate: check if target is before deployment
  if (targetTimestamp < deploymentTimestamp) {
    throw new BeforeDeploymentError();
  }

  // Binary search between deployment block and current block
  let minBlock = deploymentBlock;
  let maxBlock = currentBlock;
  let resultBlock = deploymentBlock;

  while (minBlock <= maxBlock) {
    const midBlock = Math.floor((minBlock + maxBlock) / 2);

    if (progressCallback) {
      progressCallback(midBlock, minBlock, maxBlock);
    }

    const blockData = await provider.getBlock(midBlock);
    if (!blockData) {
      throw new Error(`Failed to get block data for block ${midBlock}`);
    }

    const blockTimestamp = blockData.timestamp;

    if (blockTimestamp <= targetTimestamp) {
      // This block is at or before target, it's a candidate
      resultBlock = midBlock;
      // Search for later blocks that might still be <= target
      minBlock = midBlock + 1;
    } else {
      // This block is after target, search earlier
      maxBlock = midBlock - 1;
    }
  }

  // Get final block data to return timestamp
  const finalBlockData = await provider.getBlock(resultBlock);
  if (!finalBlockData) {
    throw new Error(`Failed to get final block data for block ${resultBlock}`);
  }

  return {
    blockNumber: resultBlock,
    timestamp: finalBlockData.timestamp,
  };
}
