import { useState } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  executeSplit,
  getBalance,
  getTotalSupply,
  getDecimals,
  formatBalance,
} from "../lib/contract";
import { validateNetwork } from "./useNetwork";

export type SplitStatus =
  | "idle"
  | "validating"
  | "pending"
  | "success"
  | "error";

export interface SplitState {
  multiplier: number;
  status: SplitStatus;
  error: string | null;
  txHash: string | null;
  beforeBalance: string | null;
  afterBalance: string | null;
  beforeTotalSupply: string | null;
  afterTotalSupply: string | null;
}

const DEFAULT_MULTIPLIER = 2; // Default 2-for-1 split (used for reset)

/**
 * Hook for execute split functionality
 */
export function useExecuteSplit() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [state, setState] = useState<SplitState>({
    multiplier: DEFAULT_MULTIPLIER, // Default to 7-for-1 split
    status: "idle",
    error: null,
    txHash: null,
    beforeBalance: null,
    afterBalance: null,
    beforeTotalSupply: null,
    afterTotalSupply: null,
  });

  /**
   * Calculate before/after balances
   */
  const calculateBalances = async () => {
    if (!isConnected || !address || !window.ethereum) {
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const decimals = await getDecimals(provider);
      const balance = await getBalance(address, provider);
      const totalSupply = await getTotalSupply(provider);

      const beforeBalance = formatBalance(balance, decimals);
      const afterBalance = formatBalance(
        balance * BigInt(state.multiplier),
        decimals
      );
      const beforeTotalSupply = formatBalance(totalSupply, decimals);
      const afterTotalSupply = formatBalance(
        totalSupply * BigInt(state.multiplier),
        decimals
      );

      setState((prev) => ({
        ...prev,
        beforeBalance,
        afterBalance,
        beforeTotalSupply,
        afterTotalSupply,
      }));
    } catch (error) {
      console.error("Error calculating balances:", error);
    }
  };

  /**
   * Execute split transaction
   */
  const execute = async (): Promise<string> => {
    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    // Validate network
    validateNetwork(chainId);

    setState((prev) => ({ ...prev, status: "validating", error: null }));

    try {
      // Calculate before balances
      await calculateBalances();

      // Get signer
      if (!window.ethereum) {
        throw new Error("Wallet provider not available");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Execute split
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await executeSplit(BigInt(state.multiplier), signer);

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      // Calculate after balances
      await calculateBalances();

      setState((prev) => ({ ...prev, status: "success" }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Split execution failed";

      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("DEFAULT_ADMIN_ROLE")) {
          errorMessage = "You do not have permission to execute splits";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({ ...prev, status: "error", error: errorMessage }));
      throw error;
    }
  };

  /**
   * Validate multiplier
   */
  const validateMultiplier = (multiplier: number): boolean => {
    return multiplier > 0 && Number.isInteger(multiplier);
  };

  /**
   * Set multiplier
   */
  const setMultiplier = (multiplier: number) => {
    // Allow setting any value - validation is only for UI feedback
    setState((prev) => ({ ...prev, multiplier }));
  };

  /**
   * Reset state
   */
  const reset = () => {
    setState({
      multiplier: DEFAULT_MULTIPLIER,
      status: "idle",
      error: null,
      txHash: null,
      beforeBalance: null,
      afterBalance: null,
      beforeTotalSupply: null,
      afterTotalSupply: null,
    });
  };

  return {
    ...state,
    calculateBalances,
    execute,
    setMultiplier,
    validateMultiplier,
    reset,
  };
}
