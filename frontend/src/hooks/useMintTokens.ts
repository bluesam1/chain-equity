import { useState } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  mintTokens,
  isOnAllowlist,
  getDecimals,
  parseAmount,
  getMultiplier,
} from "../lib/contract";
import { validateNetwork } from "./useNetwork";

export type MintStatus =
  | "idle"
  | "validating"
  | "pending"
  | "success"
  | "error";

export interface MintState {
  recipient: string;
  amount: string;
  status: MintStatus;
  error: string | null;
  txHash: string | null;
}

export interface MintValidation {
  recipientValid: boolean | null;
  recipientOnAllowlist: boolean | null;
  amountValid: boolean | null;
}

/**
 * Hook for mint tokens functionality
 */
export function useMintTokens() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [state, setState] = useState<MintState>({
    recipient: "",
    amount: "",
    status: "idle",
    error: null,
    txHash: null,
  });
  const [validation, setValidation] = useState<MintValidation>({
    recipientValid: null,
    recipientOnAllowlist: null,
    amountValid: null,
  });

  /**
   * Validate recipient address format
   */
  const validateRecipientFormat = (recipient: string): boolean => {
    return ethers.isAddress(recipient);
  };

  /**
   * Validate recipient address and allowlist status
   */
  const validateRecipient = async (recipient: string) => {
    if (!recipient) {
      setValidation((prev) => ({
        ...prev,
        recipientValid: null,
        recipientOnAllowlist: null,
      }));
      return;
    }

    const isValidFormat = validateRecipientFormat(recipient);
    setValidation((prev) => ({ ...prev, recipientValid: isValidFormat }));

    if (!isValidFormat) {
      setValidation((prev) => ({ ...prev, recipientOnAllowlist: null }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isOnList = await isOnAllowlist(recipient, provider);
      setValidation((prev) => ({ ...prev, recipientOnAllowlist: isOnList }));
    } catch (error) {
      console.error("Error checking allowlist:", error);
      setValidation((prev) => ({ ...prev, recipientOnAllowlist: null }));
    }
  };

  /**
   * Validate amount
   */
  const validateAmount = (amount: string) => {
    if (!amount) {
      setValidation((prev) => ({ ...prev, amountValid: null }));
      return;
    }

    const numAmount = parseFloat(amount);
    const isValid = !isNaN(numAmount) && numAmount > 0;
    setValidation((prev) => ({ ...prev, amountValid: isValid }));
  };

  /**
   * Check if mint is valid
   */
  const isMintValid = (): boolean => {
    return (
      validation.recipientValid === true &&
      validation.recipientOnAllowlist === true &&
      validation.amountValid === true &&
      state.recipient !== "" &&
      state.amount !== ""
    );
  };

  /**
   * Execute mint transaction
   */
  const executeMint = async (): Promise<string> => {
    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    // Validate network
    validateNetwork(chainId);

    // Validate mint
    if (!isMintValid()) {
      throw new Error("Mint validation failed");
    }

    setState((prev) => ({ ...prev, status: "validating", error: null }));

    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not available");
      }

      // Get decimals and multiplier
      const provider = new ethers.BrowserProvider(window.ethereum);
      const decimals = await getDecimals(provider);
      const multiplier = await getMultiplier(provider);

      // Parse amount (user enters displayed amount)
      // This converts to smallest units (e.g., 100 tokens = 100 * 10^18 smallest units)
      const displayedAmountBigInt = parseAmount(state.amount, decimals);

      // Convert displayed amount to base amount (divide by multiplier)
      // BigInt division truncates, which is correct - we're working in smallest units
      // Example: 100 tokens / 7 = 14.285714... base tokens = 14285714285714285714 smallest units
      // The truncation loss is minimal (e.g., 2 smallest units out of 10^20 = 0.000000000000000002%)
      const baseAmountBigInt = displayedAmountBigInt / multiplier;

      if (baseAmountBigInt === 0n) {
        throw new Error("Amount too small after accounting for multiplier");
      }

      // Get signer
      const signer = await provider.getSigner();

      // Execute mint with base amount
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await mintTokens(state.recipient, baseAmountBigInt, signer);

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      setState((prev) => ({ ...prev, status: "success" }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Mint failed";

      console.error("Mint execution error:", error);

      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("MINTER_ROLE")) {
          errorMessage = "You do not have permission to mint tokens";
        } else if (error.message.includes("allowlist")) {
          errorMessage = "Recipient must be on allowlist";
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
    setState({
      recipient: "",
      amount: "",
      status: "idle",
      error: null,
      txHash: null,
    });
    setValidation({
      recipientValid: null,
      recipientOnAllowlist: null,
      amountValid: null,
    });
  };

  return {
    ...state,
    validation,
    setRecipient: (recipient: string) => {
      setState((prev) => ({ ...prev, recipient }));
      validateRecipient(recipient);
    },
    setAmount: (amount: string) => {
      setState((prev) => ({ ...prev, amount }));
      validateAmount(amount);
    },
    validateRecipient,
    validateAmount,
    isMintValid,
    executeMint,
    reset,
  };
}
