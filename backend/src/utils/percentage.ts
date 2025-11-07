/**
 * Ownership percentage calculation utilities
 * Provides functions to calculate ownership percentages with proper precision
 */

import { ethers } from 'ethers';

const PRECISION_SCALE = 1_000_000n; // 1e6 for 6 decimal places
const PERCENTAGE_SCALE = 100n;

/**
 * Calculate ownership percentage with 6 decimal precision
 * Uses BigNumber for all calculations to avoid JavaScript number precision loss
 * Formula: (balance * 100 * 1e6) / totalSupply
 * @param balance - Token balance (BigNumber or bigint)
 * @param totalSupply - Total token supply (BigNumber or bigint)
 * @returns Percentage as string with 6 decimal places (e.g., "50.000000")
 */
export function calculateOwnershipPercentage(
  balance: bigint | ethers.BigNumberish,
  totalSupply: bigint | ethers.BigNumberish
): string {
  const balanceBN = typeof balance === 'bigint' ? balance : BigInt(balance.toString());
  const totalSupplyBN = typeof totalSupply === 'bigint' ? totalSupply : BigInt(totalSupply.toString());

  // Handle zero total supply
  if (totalSupplyBN === 0n) {
    return '0.000000';
  }

  // Formula: (balance * 100 * 1e6) / totalSupply
  // This gives us percentage * 1e6 (scaled for 6 decimal precision)
  const percentageScaled = (balanceBN * PERCENTAGE_SCALE * PRECISION_SCALE) / totalSupplyBN;

  // Convert to decimal string with 6 decimal places
  // percentageScaled / 1e6 = percentage
  const wholePart = percentageScaled / PRECISION_SCALE;
  const fractionalPart = percentageScaled % PRECISION_SCALE;

  // Format as string with 6 decimal places
  const fractionalStr = fractionalPart.toString().padStart(6, '0');
  return `${wholePart}.${fractionalStr}`;
}

/**
 * Calculate sum of all percentages and detect rounding discrepancies
 * @param percentages - Array of percentage strings
 * @returns Object with sum and rounding note
 */
export function calculatePercentageSum(percentages: string[]): {
  sum: string;
  roundingNote: string | null;
} {
  if (percentages.length === 0) {
    return { sum: '0.000000', roundingNote: null };
  }

  // Sum all percentages (convert to scaled integers, sum, then convert back)
  let totalScaled = 0n;
  for (const percentage of percentages) {
    const [whole, fractional] = percentage.split('.');
    const wholeBN = BigInt(whole || '0');
    const fractionalBN = BigInt((fractional || '0').padEnd(6, '0').slice(0, 6));
    const scaled = wholeBN * PRECISION_SCALE + fractionalBN;
    totalScaled += scaled;
  }

  // Convert back to percentage string
  const wholePart = totalScaled / PRECISION_SCALE;
  const fractionalPart = totalScaled % PRECISION_SCALE;
  const fractionalStr = fractionalPart.toString().padStart(6, '0');
  const sum = `${wholePart}.${fractionalStr}`;

  // Check if sum equals exactly 100%
  const expectedSum = 100n * PRECISION_SCALE;
  const roundingNote =
    totalScaled !== expectedSum
      ? 'Percentages may not sum to exactly 100% due to rounding'
      : null;

  return { sum, roundingNote };
}

