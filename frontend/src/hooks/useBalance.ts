import { useEffect, useState } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ethers } from "ethers";
import {
  getBalance,
  getDecimals,
  formatBalance,
  getContractInfo,
  getTotalSupply,
  type ContractInfo,
} from "../lib/contract";

export interface BalanceState {
  balance: string | null;
  symbol: string | null;
  contractInfo: ContractInfo | null;
  totalSupply: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get token balance and contract info
 */
export function useBalance() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [state, setState] = useState<BalanceState>({
    balance: null,
    symbol: null,
    contractInfo: null,
    totalSupply: null,
    isLoading: false,
    error: null,
  });

  // Fetch balance and contract info
  const fetchBalance = async () => {
    if (!isConnected || !address || !publicClient) {
      setState((prev) => ({
        ...prev,
        balance: null,
        symbol: null,
        totalSupply: null,
        isLoading: false,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Convert viem public client to ethers provider
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Fetch contract info, balance, and total supply in parallel
      const [contractInfo, balance, decimals, totalSupply] = await Promise.all([
        getContractInfo(provider),
        getBalance(address, provider),
        getDecimals(provider),
        getTotalSupply(provider),
      ]);

      const formattedBalance = formatBalance(balance, decimals);
      const formattedTotalSupply = formatBalance(totalSupply, decimals);

      setState({
        balance: formattedBalance,
        symbol: contractInfo.symbol,
        contractInfo,
        totalSupply: formattedTotalSupply,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch balance";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  // Fetch balance on mount and when address changes
  useEffect(() => {
    fetchBalance();
  }, [isConnected, address, publicClient]);

  // Listen for Transfer events to update balance
  useEffect(() => {
    if (!isConnected || !address || !publicClient) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS || "",
      [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ],
      provider
    );

    // Listen for Transfer events involving the user's address
    const filter = contract.filters.Transfer(null, address);
    const filter2 = contract.filters.Transfer(address, null);

    const handleTransfer = () => {
      // Refresh balance when transfer event is detected
      fetchBalance();
    };

    contract.on(filter, handleTransfer);
    contract.on(filter2, handleTransfer);

    return () => {
      contract.off(filter, handleTransfer);
      contract.off(filter2, handleTransfer);
    };
  }, [isConnected, address, publicClient]);

  return {
    ...state,
    refetch: fetchBalance,
  };
}
