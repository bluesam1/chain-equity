import { useState } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { ethers } from "ethers";
import { changeSymbol, getSymbol } from "../lib/contract";
import { validateNetwork } from "./useNetwork";

export type ChangeSymbolStatus =
  | "idle"
  | "validating"
  | "pending"
  | "success"
  | "error";

export interface ChangeSymbolState {
  newSymbol: string;
  currentSymbol: string | null;
  status: ChangeSymbolStatus;
  error: string | null;
  txHash: string | null;
}

/**
 * Hook for change symbol functionality
 */
export function useChangeSymbol() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [state, setState] = useState<ChangeSymbolState>({
    newSymbol: "",
    currentSymbol: null,
    status: "idle",
    error: null,
    txHash: null,
  });

  /**
   * Validate symbol format
   */
  const validateSymbol = (symbol: string): boolean => {
    // Symbol must be non-empty and typically 1-10 characters
    return (
      symbol.length > 0 && symbol.length <= 10 && /^[A-Z0-9]+$/.test(symbol)
    );
  };

  /**
   * Get current symbol
   */
  const getCurrentSymbol = async () => {
    if (!isConnected) {
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const symbol = await getSymbol(provider);
      setState((prev) => ({ ...prev, currentSymbol: symbol }));
    } catch (error) {
      console.error("Error getting current symbol:", error);
    }
  };

  /**
   * Check if symbol is valid
   */
  const isSymbolValid = (): boolean => {
    return (
      validateSymbol(state.newSymbol) && state.newSymbol !== state.currentSymbol
    );
  };

  /**
   * Execute change symbol transaction
   */
  const execute = async (): Promise<string> => {
    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    // Validate network
    validateNetwork(chainId);

    // Validate symbol
    if (!isSymbolValid()) {
      throw new Error("Invalid symbol or symbol unchanged");
    }

    setState((prev) => ({ ...prev, status: "validating", error: null }));

    try {
      // Get signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Execute change symbol
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await changeSymbol(state.newSymbol, signer);

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      // Update current symbol
      setState((prev) => ({
        ...prev,
        status: "success",
        currentSymbol: state.newSymbol,
      }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Change symbol failed";

      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("DEFAULT_ADMIN_ROLE")) {
          errorMessage = "You do not have permission to change symbol";
        } else if (error.message.includes("cannot be empty")) {
          errorMessage = "Symbol cannot be empty";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({ ...prev, status: "error", error: errorMessage }));
      throw error;
    }
  };

  /**
   * Reset state
   */
  const reset = () => {
    setState((prev) => ({
      ...prev,
      newSymbol: "",
      status: "idle",
      error: null,
      txHash: null,
    }));
  };

  return {
    ...state,
    validateSymbol,
    getCurrentSymbol,
    isSymbolValid,
    setNewSymbol: (symbol: string) =>
      setState((prev) => ({ ...prev, newSymbol: symbol })),
    execute,
    reset,
  };
}
