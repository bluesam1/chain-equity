/**
 * Cap-table service for generating cap-table from blockchain data
 */

import { ethers } from 'ethers';
import { getProvider } from './utils/provider.js';
import { getChainEquityTokenContract } from './utils/contract.js';
import { queryTransferEvents } from './utils/events.js';
import { getDeploymentBlockFromEvents } from './utils/deployment.js';
import { calculateBalancesFromEvents } from './utils/balances.js';
import { calculateOwnershipPercentage, calculatePercentageSum } from './utils/percentage.js';

export interface CapTableHolder {
  address: string;
  balance: string;
  percentage: string;
}

export interface CapTable {
  blockNumber: number;
  timestamp: number;
  totalSupply: string;
  holders: CapTableHolder[];
  roundingNote?: string;
}

/**
 * Generate cap-table from contract address
 * @param contractAddress - The contract address to query
 * @param blockNumber - Optional block number for historical queries (null = current block)
 * @param rpcUrl - Optional RPC URL for provider
 * @returns CapTable with holders and their percentages
 */
export async function generateCapTable(
  contractAddress: string,
  blockNumber?: number | null,
  rpcUrl?: string
): Promise<CapTable> {
  // Validate contract address
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  try {
    const provider = getProvider(rpcUrl);
    const contract = getChainEquityTokenContract(contractAddress, provider);

    // Get current block number if not specified
    const currentBlock = await provider.getBlockNumber();
    const targetBlock = blockNumber === null || blockNumber === undefined ? currentBlock : blockNumber;

    // Validate block number
    if (targetBlock > currentBlock) {
      throw new Error(`Block number ${targetBlock} is in the future. Current block: ${currentBlock}`);
    }

    // Get deployment block
    const deploymentBlock = await getDeploymentBlockFromEvents(contract, provider);
    if (targetBlock < deploymentBlock) {
      throw new Error(
        `Block number ${targetBlock} is before contract deployment at block ${deploymentBlock}`
      );
    }

    // Query all Transfer events from deployment to target block
    const events = await queryTransferEvents(contract, deploymentBlock, targetBlock);

    // Calculate balances from events
    const balances = calculateBalancesFromEvents(events, targetBlock);

    // Get total supply at target block
    // For current block, use contract's totalSupply (includes multiplier)
    // For historical blocks, calculate from events
    let totalSupply: bigint;
    if (targetBlock === currentBlock) {
      // Current block: use contract's totalSupply which includes multiplier
      totalSupply = await contract.totalSupply();
    } else {
      // Historical block: calculate from events
      // Sum all balances
      totalSupply = 0n;
      for (const balance of balances.values()) {
        totalSupply += balance;
      }
    }

    // Handle edge cases
    if (balances.size === 0) {
      // Empty cap-table
      const block = await provider.getBlock(targetBlock);
      return {
        blockNumber: targetBlock,
        timestamp: block?.timestamp || 0,
        totalSupply: '0',
        holders: [],
      };
    }

    if (totalSupply === 0n) {
      // Zero total supply
      const block = await provider.getBlock(targetBlock);
      return {
        blockNumber: targetBlock,
        timestamp: block?.timestamp || 0,
        totalSupply: '0',
        holders: [],
      };
    }

    // Calculate ownership percentages for all holders
    const holders: CapTableHolder[] = [];
    const percentages: string[] = [];

    for (const [address, balance] of balances.entries()) {
      const percentage = calculateOwnershipPercentage(balance, totalSupply);
      percentages.push(percentage);

      holders.push({
        address,
        balance: balance.toString(),
        percentage,
      });
    }

    // Sort holders by balance (descending)
    holders.sort((a, b) => {
      const balanceA = BigInt(a.balance);
      const balanceB = BigInt(b.balance);
      if (balanceA > balanceB) return -1;
      if (balanceA < balanceB) return 1;
      return 0;
    });

    // Calculate rounding discrepancy
    const { roundingNote } = calculatePercentageSum(percentages);

    // Get block timestamp
    const block = await provider.getBlock(targetBlock);
    const timestamp = block?.timestamp || 0;

    return {
      blockNumber: targetBlock,
      timestamp,
      totalSupply: totalSupply.toString(),
      holders,
      roundingNote: roundingNote || undefined,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate cap-table: ${error.message}`);
    }
    throw new Error(`Failed to generate cap-table: ${String(error)}`);
  }
}

/**
 * Export cap-table to CSV format
 * @param capTable - The cap-table data to export
 * @returns CSV string
 */
export function exportCapTableToCSV(capTable: CapTable): string {
  const lines: string[] = [];

  // Add metadata comments
  lines.push('# Cap-Table Export');
  lines.push(`# Block Number: ${capTable.blockNumber}`);
  
  // Format timestamp as ISO string
  const timestamp = new Date(capTable.timestamp * 1000).toISOString();
  lines.push(`# Timestamp: ${timestamp}`);
  lines.push(`# Total Supply: ${capTable.totalSupply}`);
  
  if (capTable.roundingNote) {
    lines.push(`# Note: ${capTable.roundingNote}`);
  }
  
  lines.push(''); // Empty line before headers

  // Add headers
  lines.push('address,balance,percentage');

  // Add holder rows
  for (const holder of capTable.holders) {
    lines.push(`${holder.address},${holder.balance},${holder.percentage}`);
  }

  return lines.join('\n');
}

/**
 * Export cap-table to JSON format
 * @param capTable - The cap-table data to export
 * @returns JSON string (formatted with indentation)
 */
export function exportCapTableToJSON(capTable: CapTable): string {
  // Format timestamp as ISO string
  const timestamp = new Date(capTable.timestamp * 1000).toISOString();

  const json = {
    metadata: {
      blockNumber: capTable.blockNumber,
      timestamp,
      totalSupply: capTable.totalSupply,
      ...(capTable.roundingNote && { roundingNote: capTable.roundingNote }),
    },
    holders: capTable.holders,
  };

  return JSON.stringify(json, null, 2);
}
