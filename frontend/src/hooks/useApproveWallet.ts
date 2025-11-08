import { useState } from "react";
import { ethers } from "ethers";
import { approveWallet, isOnAllowlist, revokeWallet } from "../lib/contract";
import { validateNetwork } from "./useNetwork";
import { TARGET_CHAIN_ID, isCorrectNetwork } from "../lib/network";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export type ApproveStatus =
  | "idle"
  | "validating"
  | "pending"
  | "success"
  | "error";

export interface ApproveWalletState {
  address: string;
  status: ApproveStatus;
  error: string | null;
  txHash: string | null;
  isApproved: boolean | null;
}

/**
 * Hook for approve wallet functionality
 */
export function useApproveWallet() {
  const [state, setState] = useState<ApproveWalletState>({
    address: "",
    status: "idle",
    error: null,
    txHash: null,
    isApproved: null,
  });

  /**
   * Check if address is already approved
   */
  const checkApprovalStatus = async (walletAddress: string) => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      setState((prev) => ({ ...prev, isApproved: null }));
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const isApproved = await isOnAllowlist(walletAddress, provider);
      setState((prev) => ({ ...prev, isApproved }));
    } catch (error) {
      console.error("Error checking approval status:", error);
      setState((prev) => ({ ...prev, isApproved: null }));
    }
  };

  /**
   * Execute approve wallet transaction
   */
  const executeApprove = async (walletAddress: string): Promise<string> => {
    // Check wallet connection directly from window.ethereum
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Get the current account from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    const currentAddress = accounts[0]?.address;

    if (!currentAddress) {
      throw new Error(
        "Wallet not connected. Please connect your wallet in MetaMask."
      );
    }

    // Validate network - get chainId from provider and try to switch if wrong
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (!isCorrectNetwork(currentChainId)) {
      // Try to switch to the correct network automatically
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
        });
        // Wait a bit for the switch to complete, then re-check
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newNetwork = await provider.getNetwork();
        if (!isCorrectNetwork(Number(newNetwork.chainId))) {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      } catch (switchError: any) {
        // If switch fails, try to add the network
        if (
          switchError?.code === 4902 ||
          switchError?.message?.includes("Unrecognized chain")
        ) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                  chainName: "Local Dev Network",
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["http://localhost:8545"],
                },
              ],
            });
            // Wait a bit for the network to be added
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (addError) {
            throw new Error(
              `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask. The network will be added automatically.`
            );
          }
        } else if (switchError?.code === 4001) {
          // User rejected the switch
          throw new Error(
            "Network switch was rejected. Please switch to Local Dev Network (Chain ID 31337) manually in MetaMask."
          );
        } else {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      }
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid address format");
    }

    setState((prev) => ({
      ...prev,
      address: walletAddress,
      status: "validating",
      error: null,
    }));

    try {
      // Check if already approved (reuse provider from above)
      const isApproved = await isOnAllowlist(walletAddress, provider);

      if (isApproved) {
        throw new Error("Address is already approved");
      }

      // Get signer (reuse provider from above)
      const signer = await provider.getSigner();

      // Execute approve
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await approveWallet(walletAddress, signer);

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      setState((prev) => ({ ...prev, status: "success", isApproved: true }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Approval failed";

      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("already approved")) {
          errorMessage = "Address is already approved";
        } else if (error.message.includes("APPROVER_ROLE")) {
          errorMessage = "You do not have permission to approve wallets";
        } else {
          errorMessage = error.message;
        }
      }

      setState((prev) => ({ ...prev, status: "error", error: errorMessage }));
      throw error;
    }
  };

  /**
   * Execute revoke wallet transaction
   */
  const executeRevoke = async (walletAddress: string): Promise<string> => {
    // Check wallet connection directly from window.ethereum
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    // Get the current account from MetaMask
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.listAccounts();
    const currentAddress = accounts[0]?.address;

    if (!currentAddress) {
      throw new Error(
        "Wallet not connected. Please connect your wallet in MetaMask."
      );
    }

    // Validate network - get chainId from provider and try to switch if wrong
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (!isCorrectNetwork(currentChainId)) {
      // Try to switch to the correct network automatically
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
        });
        // Wait a bit for the switch to complete, then re-check
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newNetwork = await provider.getNetwork();
        if (!isCorrectNetwork(Number(newNetwork.chainId))) {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      } catch (switchError: any) {
        // If switch fails, try to add the network
        if (
          switchError?.code === 4902 ||
          switchError?.message?.includes("Unrecognized chain")
        ) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
                  chainName: "Local Dev Network",
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["http://localhost:8545"],
                },
              ],
            });
            // Wait a bit for the network to be added
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (addError) {
            throw new Error(
              `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask. The network will be added automatically.`
            );
          }
        } else if (switchError?.code === 4001) {
          // User rejected the switch
          throw new Error(
            "Network switch was rejected. Please switch to Local Dev Network (Chain ID 31337) manually in MetaMask."
          );
        } else {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      }
    }

    if (!ethers.isAddress(walletAddress)) {
      throw new Error("Invalid address format");
    }

    setState((prev) => ({
      ...prev,
      address: walletAddress,
      status: "validating",
      error: null,
    }));

    try {
      // Get signer (reuse provider from above)
      const signer = await provider.getSigner();

      // Execute revoke
      setState((prev) => ({ ...prev, status: "pending" }));
      const tx = await revokeWallet(walletAddress, signer);

      setState((prev) => ({ ...prev, txHash: tx.hash }));

      // Wait for transaction
      await tx.wait();

      setState((prev) => ({ ...prev, status: "success", isApproved: false }));
      return tx.hash;
    } catch (error) {
      let errorMessage = "Revoke failed";

      if (error instanceof Error) {
        if (
          error.message.includes("user rejected") ||
          error.message.includes("User denied")
        ) {
          errorMessage = "Transaction rejected by user";
        } else if (error.message.includes("APPROVER_ROLE")) {
          errorMessage = "You do not have permission to revoke wallets";
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
      address: "",
      status: "idle",
      error: null,
      txHash: null,
      isApproved: null,
    });
  };

  return {
    ...state,
    checkApprovalStatus,
    executeApprove,
    executeRevoke,
    reset,
  };
}
