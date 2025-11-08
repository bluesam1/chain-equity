import { useState } from "react";
import { useAccount, useWalletClient, useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  parseAmount,
  isOnAllowlist,
  transferTokens,
  getBalance,
  getDecimals,
} from "../lib/contract";
import { validateNetwork } from "./useNetwork";

export type TransferStatus =
  | "idle"
  | "validating"
  | "pending"
  | "success"
  | "error";

export interface TransferState {
  recipient: string;
  amount: string;
  status: TransferStatus;
  error: string | null;
  txHash: string | null;
}

export interface TransferValidation {
  recipientValid: boolean | null;
  recipientOnAllowlist: boolean | null;
  senderOnAllowlist: boolean | null;
  amountValid: boolean | null;
  hasInsufficientBalance: boolean;
}

/**
 * Hook for token transfer functionality
 */
export function useTransfer() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const [state, setState] = useState<TransferState>({
    recipient: "",
    amount: "",
    status: "idle",
    error: null,
    txHash: null,
  });
  const [validation, setValidation] = useState<TransferValidation>({
    recipientValid: null,
    recipientOnAllowlist: null,
    senderOnAllowlist: null,
    amountValid: null,
    hasInsufficientBalance: false,
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
   * Validate sender allowlist status
   */
  const validateSender = async () => {
    if (!address || !isConnected) {
      setValidation((prev) => ({ ...prev, senderOnAllowlist: null }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isOnList = await isOnAllowlist(address, provider);
      setValidation((prev) => ({ ...prev, senderOnAllowlist: isOnList }));
    } catch (error) {
      console.error("Error checking sender allowlist:", error);
      setValidation((prev) => ({ ...prev, senderOnAllowlist: null }));
    }
  };

  /**
   * Validate amount
   */
  const validateAmount = async (amount: string) => {
    if (!amount) {
      setValidation((prev) => ({
        ...prev,
        amountValid: null,
        hasInsufficientBalance: false,
      }));
      return;
    }

    const numAmount = parseFloat(amount);
    const isValid = !isNaN(numAmount) && numAmount > 0;
    setValidation((prev) => ({ ...prev, amountValid: isValid }));

    if (!isValid || !address || !isConnected) {
      setValidation((prev) => ({ ...prev, hasInsufficientBalance: false }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const decimals = await getDecimals(provider);
      const balance = await getBalance(address, provider);
      const amountBigInt = parseAmount(amount, decimals);
      const hasInsufficientBalance = amountBigInt > balance;
      setValidation((prev) => ({ ...prev, hasInsufficientBalance }));
    } catch (error) {
      console.error("Error checking balance:", error);
      setValidation((prev) => ({ ...prev, hasInsufficientBalance: false }));
    }
  };

  /**
   * Check if transfer is valid
   */
  const isTransferValid = (): boolean => {
    return (
      validation.recipientValid === true &&
      validation.recipientOnAllowlist === true &&
      validation.senderOnAllowlist === true &&
      validation.amountValid === true &&
      !validation.hasInsufficientBalance &&
      state.recipient !== "" &&
      state.amount !== ""
    );
  };

  /**
   * Execute transfer
   */
  const executeTransfer = async (): Promise<string> => {
    if (!isConnected || !address || !walletClient) {
      throw new Error("Wallet not connected");
    }

    // Validate network
    validateNetwork(chainId);

    // Validate transfer
    if (!isTransferValid()) {
      throw new Error("Transfer validation failed");
    }

    setState((prev) => ({ ...prev, status: "validating", error: null }));

    try {
      if (!window.ethereum) {
        throw new Error("Wallet provider not available");
      }

      // Get decimals
      const provider = new ethers.BrowserProvider(window.ethereum);
      const decimals = await getDecimals(provider);

      // Parse amount (user enters displayed amount)
      // This converts to smallest units (e.g., 100 tokens = 100 * 10^18 smallest units)
      // The contract will convert displayed amount to base amount internally
      const displayedAmountBigInt = parseAmount(state.amount, decimals);

      // Get signer
      const signer = await provider.getSigner();

      // Execute transfer with displayed amount
      // The contract's transfer() function now accepts displayed amounts and converts to base internally
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await transferTokens(
        state.recipient,
        displayedAmountBigInt,
        signer
      );

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      setState((prev) => ({ ...prev, status: "success" }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Transfer failed";

      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("insufficient balance")) {
          errorMessage = "Insufficient balance";
        } else if (error.message.includes("allowlist")) {
          errorMessage = "Recipient not on allowlist";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({ ...prev, status: "error", error: errorMessage }));
      throw error;
    }
  };

  /**
   * Reset transfer state
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
      senderOnAllowlist: null,
      amountValid: null,
      hasInsufficientBalance: false,
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
    validateSender,
    validateAmount,
    isTransferValid,
    executeTransfer,
    reset,
  };
}
