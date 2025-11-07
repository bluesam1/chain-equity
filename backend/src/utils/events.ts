/**
 * Event query utilities
 * Provides functions to query blockchain events for cap-table calculations
 */

import type { ChainEquityToken } from '../../../contracts/typechain-types/src/ChainEquityToken.js';
import type { TransferEvent } from '../../../contracts/typechain-types/src/ChainEquityToken.js';
import type { TypedEventLog } from '../../../contracts/typechain-types/common.js';

/**
 * Query Transfer events from a contract
 * @param contract - The ChainEquityToken contract instance
 * @param fromBlock - Starting block number (or block tag)
 * @param toBlock - Ending block number (or block tag)
 * @returns Array of Transfer event logs
 */
export async function queryTransferEvents(
  contract: ChainEquityToken,
  fromBlock: number | string = 'earliest',
  toBlock: number | string = 'latest'
): Promise<TypedEventLog<TransferEvent.Event>[]> {
  try {
    const filter = contract.filters.Transfer();
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    return events as TypedEventLog<TransferEvent.Event>[];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to query Transfer events: ${error.message}`);
    }
    throw new Error(`Failed to query Transfer events: ${String(error)}`);
  }
}

/**
 * Query Mint events (Transfer events with from = zero address)
 * @param contract - The ChainEquityToken contract instance
 * @param fromBlock - Starting block number (or block tag)
 * @param toBlock - Ending block number (or block tag)
 * @returns Array of Transfer event logs where from is zero address
 */
export async function queryMintEvents(
  contract: ChainEquityToken,
  fromBlock: number | string = 'earliest',
  toBlock: number | string = 'latest'
): Promise<TypedEventLog<TransferEvent.Event>[]> {
  try {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const filter = contract.filters.Transfer(ZERO_ADDRESS);
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    return events as TypedEventLog<TransferEvent.Event>[];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to query Mint events: ${error.message}`);
    }
    throw new Error(`Failed to query Mint events: ${String(error)}`);
  }
}

/**
 * Query Burn events (Transfer events with to = zero address)
 * @param contract - The ChainEquityToken contract instance
 * @param fromBlock - Starting block number (or block tag)
 * @param toBlock - Ending block number (or block tag)
 * @returns Array of Transfer event logs where to is zero address
 */
export async function queryBurnEvents(
  contract: ChainEquityToken,
  fromBlock: number | string = 'earliest',
  toBlock: number | string = 'latest'
): Promise<TypedEventLog<TransferEvent.Event>[]> {
  try {
    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
    const filter = contract.filters.Transfer(undefined, ZERO_ADDRESS);
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    return events as TypedEventLog<TransferEvent.Event>[];
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to query Burn events: ${error.message}`);
    }
    throw new Error(`Failed to query Burn events: ${String(error)}`);
  }
}

