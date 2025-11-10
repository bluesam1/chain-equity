import { useEffect, useState, useRef, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { ethers } from "ethers";
import {
  getBalance,
  getDecimals,
  formatBalance,
  getSymbol,
} from "../lib/contract";

export interface WalletBalanceState {
  balance: string | null;
  symbol: string | null;
  isLoading: boolean;
  error: string | null;
}

interface BalanceCache {
  [address: string]: {
    balance: string;
    symbol: string;
    timestamp: number;
  };
}

const CACHE_DURATION = 30000; // 30 seconds
const cache: BalanceCache = {};

/**
 * Hook to get token balance for any wallet address
 * @param address The wallet address to fetch balance for
 * @param enabled Whether to fetch balance (for lazy loading)
 */
export function useWalletBalance(address: string, enabled: boolean = true) {
  const publicClient = usePublicClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<WalletBalanceState>({
    balance: null,
    symbol: null,
    isLoading: false,
    error: null,
  });

  // Check cache before fetching
  const getCachedBalance = useCallback(
    (addr: string): { balance: string; symbol: string } | null => {
      const cached = cache[addr];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return { balance: cached.balance, symbol: cached.symbol };
      }
      return null;
    },
    []
  );

  // Invalidate cache for an address
  const invalidateCache = useCallback((addr: string) => {
    delete cache[addr];
  }, []);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!address || !enabled || !publicClient) {
      setState((prev) => ({
        ...prev,
        balance: null,
        symbol: null,
        isLoading: false,
      }));
      return;
    }

    // Check cache first
    const cached = getCachedBalance(address);
    if (cached) {
      setState({
        balance: cached.balance,
        symbol: cached.symbol,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Convert viem public client to ethers provider
      if (!window.ethereum) {
        throw new Error("Wallet not available");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);

      // Fetch symbol, decimals, and balance in parallel
      const [symbol, decimals, balance] = await Promise.all([
        getSymbol(provider),
        getDecimals(provider),
        getBalance(address, provider),
      ]);

      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      const formattedBalance = formatBalance(balance, decimals);

      // Cache the result
      cache[address] = {
        balance: formattedBalance,
        symbol,
        timestamp: Date.now(),
      };

      setState({
        balance: formattedBalance,
        symbol,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch balance";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [address, enabled, publicClient, getCachedBalance]);

  // Fetch balance when enabled and address changes
  useEffect(() => {
    if (enabled && address) {
      fetchBalance();
    }

    // Cleanup: cancel request on unmount or when dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, address, fetchBalance]);

  // Listen for Transfer events to invalidate cache
  useEffect(() => {
    if (!address || !publicClient || !window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(
      import.meta.env.VITE_CONTRACT_ADDRESS || "",
      [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ],
      provider
    );

    // Listen for Transfer events involving this address
    const filter1 = contract.filters.Transfer(null, address);
    const filter2 = contract.filters.Transfer(address, null);

    const handleTransfer = () => {
      // Invalidate cache for this address
      invalidateCache(address);
      // Refetch balance
      fetchBalance();
    };

    contract.on(filter1, handleTransfer);
    contract.on(filter2, handleTransfer);

    return () => {
      contract.off(filter1, handleTransfer);
      contract.off(filter2, handleTransfer);
    };
  }, [address, publicClient, invalidateCache, fetchBalance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    ...state,
    refetch: fetchBalance,
  };
}


