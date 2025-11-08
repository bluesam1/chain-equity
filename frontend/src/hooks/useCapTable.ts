import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import { ethers } from "ethers";
import {
  getContractAddress,
  getBalance,
  getTotalSupply,
  getDecimals,
  formatBalance,
} from "../lib/contract";
import { getContractDeploymentBlock } from "../lib/blockLookup";

export interface CapTableEntry extends Record<string, unknown> {
  address: string;
  balance: string;
  percentage: string;
}

export interface CapTableState {
  entries: CapTableEntry[];
  isLoading: boolean;
  error: string | null;
  totalSupply: string | null;
  blockNumber: number | null;
}

/**
 * Hook for cap table functionality
 */
export function useCapTable(blockNumber?: number) {
  const publicClient = usePublicClient();
  const [state, setState] = useState<CapTableState>({
    entries: [],
    isLoading: false,
    error: null,
    totalSupply: null,
    blockNumber: null,
  });

  /**
   * Calculate ownership percentage
   */
  const calculatePercentage = (
    balance: bigint,
    totalSupply: bigint
  ): string => {
    if (totalSupply === 0n) {
      return "0.000000";
    }
    // Use formula: (balance * 100 * 1e6) / totalSupply
    const percentageBigInt =
      (balance * BigInt(100) * BigInt(1e6)) / totalSupply;
    // Format with 6 decimal places
    return ethers.formatUnits(percentageBigInt, 6);
  };

  /**
   * Fetch cap table data
   */
  const fetchCapTable = async () => {
    if (!publicClient) {
      setState((prev) => ({ ...prev, error: "Provider not available" }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const decimals = await getDecimals(provider);

      // Get current block number
      const currentBlock = await provider.getBlockNumber();
      const queryBlockNumber = blockNumber || currentBlock;

      // Validate block number is not in the future
      if (queryBlockNumber > currentBlock) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Block number ${queryBlockNumber} is in the future. Current block is ${currentBlock}.`,
        }));
        return;
      }

      // Get contract address and deployment block
      const contractAddress = getContractAddress();

      // Validate block number is not before contract deployment
      try {
        const deploymentBlock = await getContractDeploymentBlock(
          provider,
          contractAddress
        );
        if (queryBlockNumber < deploymentBlock) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: `Block number ${queryBlockNumber} is before contract deployment at block ${deploymentBlock}.`,
          }));
          return;
        }
      } catch (deploymentError) {
        // If we can't find deployment block, continue but log warning
        console.warn(
          "Could not determine contract deployment block:",
          deploymentError
        );
      }

      // Get total supply at the specified block number
      let totalSupply: bigint;
      try {
        totalSupply = await getTotalSupply(provider, queryBlockNumber);
      } catch (supplyError) {
        // Handle CALL_EXCEPTION for invalid block numbers
        if (
          supplyError instanceof Error &&
          supplyError.message.includes("CALL_EXCEPTION")
        ) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: `Cannot query block ${queryBlockNumber}. The contract may not exist at this block, or the block number is invalid.`,
          }));
          return;
        }
        throw supplyError;
      }
      const totalSupplyFormatted = formatBalance(totalSupply, decimals);

      // Query Transfer events to get all addresses that have received tokens
      const contract = new ethers.Contract(
        contractAddress,
        [
          "event Transfer(address indexed from, address indexed to, uint256 value)",
        ],
        provider
      );

      // Query Transfer events from contract deployment to query block
      // Use block ranges to avoid timeouts
      const fromBlock = 0; // Contract deployment block (or earliest available)
      const toBlock = queryBlockNumber;

      // Get all Transfer events up to the query block
      const transferFilter = contract.filters.Transfer();
      const transfers = await contract.queryFilter(
        transferFilter,
        fromBlock,
        toBlock
      );

      // Build address set from Transfer events
      const addressSet = new Set<string>();
      transfers.forEach((event) => {
        // Check if event is EventLog (has args property)
        if ("args" in event && event.args) {
          const from = event.args[0] as string;
          const to = event.args[1] as string;
          if (from && from !== ethers.ZeroAddress) {
            addressSet.add(from);
          }
          if (to && to !== ethers.ZeroAddress) {
            addressSet.add(to);
          }
        }
      });

      // Also query Mint events to catch addresses that received tokens via mint but never transferred
      const mintFilter = contract.filters.Transfer(ethers.ZeroAddress, null);
      const mints = await contract.queryFilter(mintFilter, fromBlock, toBlock);
      mints.forEach((event) => {
        if ("args" in event && event.args) {
          const to = event.args[1] as string;
          if (to && to !== ethers.ZeroAddress) {
            addressSet.add(to);
          }
        }
      });

      // Get balances for all addresses at the specified block number
      const entries: CapTableEntry[] = [];
      const addresses = Array.from(addressSet);

      // Process in batches to avoid overwhelming the provider
      const batchSize = 10;
      for (let i = 0; i < addresses.length; i += batchSize) {
        const batch = addresses.slice(i, i + batchSize);
        const balancePromises = batch.map(async (address) => {
          try {
            const balance = await getBalance(
              address,
              provider,
              queryBlockNumber
            );
            const balanceFormatted = formatBalance(balance, decimals);
            const percentage = calculatePercentage(balance, totalSupply);
            return {
              address,
              balance: balanceFormatted,
              percentage,
            };
          } catch (balanceError) {
            // Handle CALL_EXCEPTION for invalid block numbers
            if (
              balanceError instanceof Error &&
              balanceError.message.includes("CALL_EXCEPTION")
            ) {
              console.warn(
                `Failed to get balance for ${address} at block ${queryBlockNumber}:`,
                balanceError
              );
              // Return zero balance entry (will be filtered out)
              return {
                address,
                balance: "0",
                percentage: "0.000000",
              };
            }
            throw balanceError;
          }
        });
        const batchEntries = await Promise.all(balancePromises);
        entries.push(...batchEntries);
      }

      // Filter out zero balances (sorting is handled by the Table component)
      const filteredEntries = entries.filter(
        (entry) => parseFloat(entry.balance) > 0
      );

      // Calculate sum of all balances to verify against total supply
      const sumOfBalances = filteredEntries.reduce((sum, entry) => {
        return sum + parseFloat(entry.balance);
      }, 0);

      // Calculate sum of all percentages
      const sumOfPercentages = filteredEntries.reduce((sum, entry) => {
        return sum + parseFloat(entry.percentage);
      }, 0);

      // Log validation info for debugging
      console.log("Cap Table Validation:", {
        totalSupply: totalSupplyFormatted,
        sumOfBalances: sumOfBalances.toFixed(6),
        sumOfPercentages: sumOfPercentages.toFixed(6),
        entryCount: filteredEntries.length,
        blockNumber: queryBlockNumber,
      });

      setState({
        entries: filteredEntries,
        isLoading: false,
        error: null,
        totalSupply: totalSupplyFormatted,
        blockNumber: queryBlockNumber,
      });
    } catch (error) {
      let errorMessage = "Failed to fetch cap table";

      if (error instanceof Error) {
        // Handle CALL_EXCEPTION specifically
        if (
          error.message.includes("CALL_EXCEPTION") ||
          error.message.includes("missing revert data")
        ) {
          errorMessage = `Cannot query block ${
            blockNumber || "latest"
          }. The contract may not exist at this block, or the block number is invalid. Please try a different block number.`;
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  // Fetch cap table on mount and when block number changes
  useEffect(() => {
    fetchCapTable();
  }, [publicClient, blockNumber]);

  return {
    ...state,
    refetch: fetchCapTable,
  };
}
