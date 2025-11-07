/**
 * Contract interaction utilities
 * Provides contract instance creation with TypeChain types
 */

import { ethers, ContractRunner } from 'ethers';
import type { ChainEquityToken } from '../../../contracts/typechain-types/src/ChainEquityToken.js';
import { ChainEquityToken__factory } from '../../../contracts/typechain-types/factories/src/ChainEquityToken__factory.js';

/**
 * Create a ChainEquityToken contract instance
 * @param contractAddress - The contract address
 * @param runner - Contract runner (provider or signer)
 * @returns ChainEquityToken contract instance
 */
export function getChainEquityTokenContract(
  contractAddress: string,
  runner: ContractRunner
): ChainEquityToken {
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }
  return ChainEquityToken__factory.connect(contractAddress, runner);
}

