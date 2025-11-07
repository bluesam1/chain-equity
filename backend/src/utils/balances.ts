/**
 * Balance calculation utilities
 * Provides functions to calculate token holder balances from events
 */

import type { TransferEvent } from '../../../contracts/typechain-types/src/ChainEquityToken.js';
import type { TypedEventLog } from '../../../contracts/typechain-types/common.js';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Calculate token holder balances from Transfer events
 * Processes events chronologically to track balance changes
 * @param events - Array of Transfer event logs, sorted by block number and transaction index
 * @param toBlock - Optional block number to calculate balances up to (for historical queries)
 * @returns Map of address -> balance (BigNumber)
 */
export function calculateBalancesFromEvents(
  events: TypedEventLog<TransferEvent.Event>[],
  toBlock?: number
): Map<string, bigint> {
  const balances = new Map<string, bigint>();

  // Sort events chronologically by block number, then transaction index
  const sortedEvents = [...events].sort((a, b) => {
    if (a.blockNumber !== b.blockNumber) {
      return Number(a.blockNumber - b.blockNumber);
    }
    // If same block, sort by transaction index
    return (a.index || 0) - (b.index || 0);
  });

  // Process each event
  for (const event of sortedEvents) {
    // Skip if querying historical block and event is after target block
    if (toBlock !== undefined && event.blockNumber > toBlock) {
      continue;
    }

    const args = event.args;
    const from = args.from.toLowerCase();
    const to = args.to.toLowerCase();
    const value = args.value;

    // Process Transfer event: subtract from sender, add to recipient
    // Skip zero address (mint/burn are handled separately)
    
    // Subtract from sender (if not zero address - zero address means mint)
    if (from !== ZERO_ADDRESS) {
      const currentBalance = balances.get(from) || 0n;
      balances.set(from, currentBalance - value);
    }

    // Add to recipient (if not zero address - zero address means burn)
    if (to !== ZERO_ADDRESS) {
      const currentBalance = balances.get(to) || 0n;
      balances.set(to, currentBalance + value);
    }
  }

  // Remove zero balances
  for (const [address, balance] of balances.entries()) {
    if (balance === 0n) {
      balances.delete(address);
    }
  }

  return balances;
}

/**
 * Apply virtual split multiplier to balances
 * Used for current state queries where the contract applies a multiplier
 * @param balances - Map of address -> balance
 * @param multiplier - The multiplier to apply
 * @returns Map of address -> balance with multiplier applied
 */
export function applyMultiplierToBalances(
  balances: Map<string, bigint>,
  multiplier: bigint
): Map<string, bigint> {
  const multipliedBalances = new Map<string, bigint>();
  
  for (const [address, balance] of balances.entries()) {
    multipliedBalances.set(address, balance * multiplier);
  }
  
  return multipliedBalances;
}

