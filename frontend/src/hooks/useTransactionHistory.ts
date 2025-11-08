import { useEffect, useState, useCallback, useRef } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { ethers, type Provider } from "ethers";
import { getContractAddress, getDecimals } from "../lib/contract";
import {
  getContractDeploymentBlock,
  findBlockByTimestamp,
  ContractNotFoundError,
} from "../lib/blockLookup";

/**
 * Transaction types
 */
export type TransactionType =
  | "Transfer"
  | "Mint"
  | "Burn"
  | "Split"
  | "SymbolChange"
  | "AllowlistUpdate";

/**
 * Transaction interface
 */
export interface Transaction {
  hash: string;
  type: TransactionType;
  blockNumber: number;
  timestamp: number;
  from: string | null;
  to: string | null;
  amount: string | null;
  eventData: {
    [key: string]: unknown;
  };
}

/**
 * Date range filter
 */
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Transaction history state
 */
export interface TransactionHistoryState {
  transactions: Transaction[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  totalCount: number | null; // Approximate total count
}

/**
 * Options for fetching transactions
 */
export interface TransactionHistoryOptions {
  page?: number;
  pageSize?: number;
  dateRange?: DateRange;
  reverseOrder?: boolean;
  loadMore?: boolean; // If true, append to existing transactions instead of replacing
  address?: string | null; // Filter by address (from, to, or event-specific fields)
}

/**
 * Hook for transaction history functionality
 *
 * @param options - Options for fetching transactions
 * @returns Transaction history state and functions
 */
export function useTransactionHistory(options: TransactionHistoryOptions = {}) {
  const {
    page = 1,
    pageSize = 50,
    dateRange,
    reverseOrder = true,
    address,
  } = options;

  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const [state, setState] = useState<TransactionHistoryState>({
    transactions: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
    currentPage: page,
    totalCount: null,
  });

  // Cache for block timestamps (blocks don't change)
  const timestampCacheRef = useRef<Map<number, number>>(new Map());

  // Cache for queried block ranges (stores transaction results)
  const queriedBlockRangesRef = useRef<Map<string, Transaction[]>>(new Map());

  // Constants for virtual paging
  const ESTIMATED_EVENTS_PER_BLOCK = 10;
  const EVENTS_PER_PAGE = pageSize;
  const BLOCKS_PER_PAGE = Math.ceil(
    EVENTS_PER_PAGE / ESTIMATED_EVENTS_PER_BLOCK
  );

  /**
   * Get block timestamp with caching
   */
  const getBlockTimestamp = useCallback(
    async (provider: Provider, blockNumber: number): Promise<number> => {
      // Check cache first
      if (timestampCacheRef.current.has(blockNumber)) {
        return timestampCacheRef.current.get(blockNumber)!;
      }

      // Fetch block and cache timestamp
      const block = await provider.getBlock(blockNumber);
      if (!block) {
        throw new Error(`Failed to get block ${blockNumber}`);
      }

      const timestamp = block.timestamp;
      timestampCacheRef.current.set(blockNumber, timestamp);
      return timestamp;
    },
    []
  );

  /**
   * Convert date to block number
   */
  const convertDateToBlock = useCallback(
    async (provider: Provider, date: Date): Promise<number> => {
      const timestamp = Math.floor(date.getTime() / 1000);
      const result = await findBlockByTimestamp(provider, timestamp);
      return result.blockNumber;
    },
    []
  );

  /**
   * Identify transaction type from event
   */
  const identifyTransactionType = useCallback(
    (eventName: string, eventArgs: unknown[]): TransactionType => {
      if (eventName === "Transfer") {
        const from = eventArgs[0] as string;
        const to = eventArgs[1] as string;

        if (from === ethers.ZeroAddress) {
          return "Mint";
        }
        if (to === ethers.ZeroAddress) {
          return "Burn";
        }
        return "Transfer";
      }

      if (eventName === "SplitExecuted") {
        return "Split";
      }

      if (eventName === "SymbolChanged") {
        return "SymbolChange";
      }

      if (eventName === "AllowlistUpdated") {
        return "AllowlistUpdate";
      }

      return "Transfer"; // Default fallback
    },
    []
  );

  /**
   * Convert event to transaction object
   */
  const convertEventToTransaction = useCallback(
    async (
      provider: Provider,
      event: ethers.Log,
      decimals: number
    ): Promise<Transaction | null> => {
      if (!("args" in event) || !event.args) {
        return null;
      }

      // Get event name from tagged type, fragment, or eventName
      let eventName = "";
      if ("_eventType" in event && event._eventType) {
        eventName = event._eventType;
      } else if ("fragment" in event && event.fragment) {
        eventName = event.fragment.name;
      } else if ("eventName" in event) {
        eventName = event.eventName as string;
      }

      const eventArgs = event.args as unknown[];

      // Get transaction type
      const type = identifyTransactionType(eventName, eventArgs);

      // Get block timestamp
      const timestamp = await getBlockTimestamp(provider, event.blockNumber);

      // Extract event-specific data
      const eventData: { [key: string]: unknown } = {};
      let from: string | null = null;
      let to: string | null = null;
      let amount: string | null = null;

      if (type === "Transfer" || type === "Mint" || type === "Burn") {
        from = eventArgs[0] as string;
        to = eventArgs[1] as string;
        const value = eventArgs[2] as bigint;
        amount = ethers.formatUnits(value, decimals);
      } else if (type === "Split") {
        const multiplier = eventArgs[0] as bigint;
        const blockNumber = eventArgs[1] as bigint;
        eventData.multiplier = multiplier.toString();
        eventData.blockNumber = blockNumber.toString();
      } else if (type === "SymbolChange") {
        const oldSymbol = eventArgs[0] as string;
        const newSymbol = eventArgs[1] as string;
        eventData.oldSymbol = oldSymbol;
        eventData.newSymbol = newSymbol;
      } else if (type === "AllowlistUpdate") {
        const account = eventArgs[0] as string;
        const approved = eventArgs[1] as boolean;
        eventData.account = account;
        eventData.approved = approved;
      }

      return {
        hash: event.transactionHash,
        type,
        blockNumber: event.blockNumber,
        timestamp,
        from,
        to,
        amount,
        eventData,
      };
    },
    [identifyTransactionType, getBlockTimestamp]
  );

  /**
   * Calculate block range for a page
   */
  const calculateBlockRange = useCallback(
    (
      pageNum: number,
      startBlock: number,
      endBlock: number,
      reverse: boolean
    ): { fromBlock: number; toBlock: number } => {
      if (reverse) {
        // Reverse chronological order: start from endBlock, work backwards
        const toBlock = endBlock - (pageNum - 1) * BLOCKS_PER_PAGE;
        const fromBlock = Math.max(startBlock, toBlock - BLOCKS_PER_PAGE + 1);
        return { fromBlock, toBlock };
      } else {
        // Forward chronological order: start from startBlock, work forwards
        const fromBlock = startBlock + (pageNum - 1) * BLOCKS_PER_PAGE;
        const toBlock = Math.min(endBlock, fromBlock + BLOCKS_PER_PAGE - 1);
        return { fromBlock, toBlock };
      }
    },
    [BLOCKS_PER_PAGE]
  );

  /**
   * Check if block range has been queried
   */
  const isBlockRangeQueried = useCallback((cacheKey: string): boolean => {
    return queriedBlockRangesRef.current.has(cacheKey);
  }, []);

  /**
   * Get cached transactions for block range
   */
  const getCachedTransactions = useCallback(
    (cacheKey: string): Transaction[] | null => {
      return queriedBlockRangesRef.current.get(cacheKey) || null;
    },
    []
  );

  /**
   * Mark block range as queried and cache results
   */
  const markBlockRangeQueried = useCallback(
    (cacheKey: string, transactions: Transaction[]): void => {
      queriedBlockRangesRef.current.set(cacheKey, transactions);
    },
    []
  );

  /**
   * Clear queried block ranges cache
   */
  const clearBlockRangeCache = useCallback((): void => {
    queriedBlockRangesRef.current.clear();
  }, []);

  /**
   * Helper function to query with retry and rate limit handling
   */
  const queryWithRetry = useCallback(
    async (
      queryFn: () => Promise<ethers.Log[]>,
      retries = 3,
      delay = 2000
    ): Promise<ethers.Log[]> => {
      for (let i = 0; i < retries; i++) {
        try {
          return await queryFn();
        } catch (error) {
          const isLastAttempt = i === retries - 1;
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          const errorCode = (error as any)?.code;

          // Check for MetaMask blocking or rate limiting
          const isRateLimit =
            errorMessage.includes("too many errors") ||
            errorMessage.includes("rate limit") ||
            errorMessage.includes("-32002") ||
            errorCode === -32002 ||
            errorMessage.includes("retrying in");

          if (isRateLimit && !isLastAttempt) {
            // Extract retry time from error message if available (e.g., "retrying in 20.64 minutes")
            const retryMatch = errorMessage.match(
              /retrying in ([\d.]+) minutes?/i
            );
            if (retryMatch) {
              const minutes = parseFloat(retryMatch[1]);
              // Wait for the specified time plus a small buffer, but cap at 5 minutes
              const waitTime = Math.min(
                minutes * 60 * 1000 + 5000,
                5 * 60 * 1000
              );
              console.warn(
                `MetaMask is blocking requests. Waiting ${Math.round(
                  waitTime / 1000
                )}s before retry...`
              );
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            } else {
              // Exponential backoff for rate limiting (increased base delay)
              const backoffDelay = delay * Math.pow(2, i);
              await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            }
            continue;
          }

          // If it's the last attempt or not a rate limit error, throw
          throw error;
        }
      }
      throw new Error("Failed to query after retries");
    },
    []
  );

  /**
   * Fetch transactions for a specific block range
   */
  const fetchTransactionsForBlockRange = useCallback(
    async (
      provider: Provider,
      contract: ethers.Contract,
      fromBlock: number,
      toBlock: number,
      decimals: number,
      filterAddress?: string | null
    ): Promise<Transaction[]> => {
      // Check cache first (include address in cache key if filtering)
      const cacheKey = filterAddress
        ? `${fromBlock}-${toBlock}-${filterAddress}`
        : `${fromBlock}-${toBlock}`;
      const cachedTransactions = getCachedTransactions(cacheKey);
      if (cachedTransactions !== null) {
        // Return cached transactions if already queried
        return cachedTransactions;
      }

      // Query events in the block range with address filtering if provided
      // Use sequential queries with delays to avoid rate limiting
      // Note: Allowlist updates are excluded from transaction history
      let transfers: ethers.Log[] = [];

      try {
        if (filterAddress) {
          // Filter by address: Query all transfers once, then filter in JavaScript
          // This reduces MetaMask prompts from 2 to 1
          const allTransfers = await queryWithRetry(() =>
            contract.queryFilter(
              contract.filters.Transfer(),
              fromBlock,
              toBlock
            )
          );

          // Filter transfers where address is either from or to
          const filterAddressLower = filterAddress.toLowerCase();
          transfers = allTransfers.filter((event) => {
            if (!("args" in event) || !event.args) return false;
            const from = (event.args[0] as string)?.toLowerCase();
            const to = (event.args[1] as string)?.toLowerCase();
            return from === filterAddressLower || to === filterAddressLower;
          });
        } else {
          // Query all events sequentially with delays
          transfers = await queryWithRetry(() =>
            contract.queryFilter(
              contract.filters.Transfer(),
              fromBlock,
              toBlock
            )
          );
        }

        // Query other events (SplitExecuted, SymbolChanged don't have address parameters)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const splits = await queryWithRetry(() =>
          contract.queryFilter(
            contract.filters.SplitExecuted(),
            fromBlock,
            toBlock
          )
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        const symbolChanges = await queryWithRetry(() =>
          contract.queryFilter(
            contract.filters.SymbolChanged(),
            fromBlock,
            toBlock
          )
        );

        // Tag events with their type and combine
        // Note: Allowlist updates are excluded from transaction history
        const allEvents: (ethers.Log & { _eventType?: string })[] = [
          ...transfers.map((e) => ({ ...e, _eventType: "Transfer" })),
          ...splits.map((e) => ({ ...e, _eventType: "SplitExecuted" })),
          ...symbolChanges.map((e) => ({ ...e, _eventType: "SymbolChanged" })),
        ];

        // Sort events chronologically (by block number, then transaction index)
        allEvents.sort((a, b) => {
          if (a.blockNumber !== b.blockNumber) {
            return a.blockNumber - b.blockNumber;
          }
          if ("transactionIndex" in a && "transactionIndex" in b) {
            return (
              (a.transactionIndex as number) - (b.transactionIndex as number)
            );
          }
          return 0;
        });

        // Reverse if needed (newest first)
        if (reverseOrder) {
          allEvents.reverse();
        }

        // Convert events to transactions in batches
        // Filter out AllowlistUpdate transactions
        const batchSize = 10;
        const transactions: Transaction[] = [];

        for (let i = 0; i < allEvents.length; i += batchSize) {
          const batch = allEvents.slice(i, i + batchSize);
          const batchPromises = batch.map((event) =>
            convertEventToTransaction(provider, event, decimals)
          );
          const batchTransactions = await Promise.all(batchPromises);

          const validTransactions = batchTransactions.filter(
            (tx): tx is Transaction =>
              tx !== null && tx.type !== "AllowlistUpdate"
          );
          transactions.push(...validTransactions);
        }

        // Mark block range as queried and cache results (include address in cache key if filtering)
        markBlockRangeQueried(cacheKey, transactions);

        return transactions;
      } catch (error) {
        // Re-throw to be handled by caller
        throw error;
      }
    },
    [
      reverseOrder,
      convertEventToTransaction,
      queryWithRetry,
      getCachedTransactions,
      markBlockRangeQueried,
    ]
  );

  /**
   * Fetch transactions
   */
  const fetchTransactions = useCallback(
    async (loadMore: boolean = false) => {
      if (!publicClient) {
        setState((prev) => ({
          ...prev,
          error: "Provider not available",
          isLoading: false,
          isLoadingMore: false,
        }));
        return;
      }

      // Check if window.ethereum is available (read-only operations don't require wallet connection)
      if (!window.ethereum) {
        setState((prev) => ({
          ...prev,
          error:
            "MetaMask is not installed or not available. Please install MetaMask to view transaction history.",
          isLoading: false,
          isLoadingMore: false,
        }));
        return;
      }

      if (loadMore) {
        setState((prev) => ({ ...prev, isLoadingMore: true, error: null }));
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          isLoadingMore: false,
          error: null,
        }));
        // Clear cache when starting fresh
        clearBlockRangeCache();
      }

      try {
        // Check if window.ethereum is available
        if (!window.ethereum) {
          throw new Error("MetaMask is not installed or not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = getContractAddress();

        // Verify contract exists at the current block before proceeding
        const currentBlock = await provider.getBlockNumber();
        const contractCode = await provider.getCode(
          contractAddress,
          currentBlock
        );
        if (!contractCode || contractCode === "0x") {
          throw new Error(
            `Contract not found at address ${contractAddress}. Please verify the contract is deployed and the address is correct in your .env file (VITE_CONTRACT_ADDRESS).`
          );
        }

        // Get deployment block
        const deploymentBlock = await getContractDeploymentBlock(
          provider,
          contractAddress
        );

        // Determine block range for query
        let fromBlock = deploymentBlock;
        let toBlock = currentBlock;

        // If date range is provided, convert dates to block numbers
        if (dateRange?.startDate) {
          const startBlock = await convertDateToBlock(
            provider,
            dateRange.startDate
          );
          fromBlock = Math.max(fromBlock, startBlock);
        }

        if (dateRange?.endDate) {
          const endBlock = await convertDateToBlock(
            provider,
            dateRange.endDate
          );
          toBlock = Math.min(toBlock, endBlock);
        }

        // Validate block range
        if (fromBlock > toBlock) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            isLoadingMore: false,
            error: "Invalid date range: start date is after end date",
          }));
          return;
        }

        // Get decimals for formatting amounts
        const decimals = await getDecimals(provider);

        // Create contract instance with event ABIs
        const contract = new ethers.Contract(
          contractAddress,
          [
            "event Transfer(address indexed from, address indexed to, uint256 value)",
            "event SplitExecuted(uint256 newMultiplier, uint256 blockNumber)",
            "event SymbolChanged(string oldSymbol, string newSymbol)",
            "event AllowlistUpdated(address indexed account, bool approved)",
          ],
          provider
        );

        // When filtering by address, query all blocks (not paginated)
        // Otherwise, use pagination with block ranges
        let newTransactions: Transaction[];
        const currentPageNum = loadMore ? state.currentPage + 1 : page;

        if (address) {
          // Query full block range when filtering by address
          newTransactions = await fetchTransactionsForBlockRange(
            provider,
            contract,
            fromBlock,
            toBlock,
            decimals,
            address
          );
        } else {
          // Calculate block range for current page (pagination)
          const blockRange = calculateBlockRange(
            currentPageNum,
            fromBlock,
            toBlock,
            reverseOrder
          );

          // Check if we've reached the end
          if (
            blockRange.fromBlock > blockRange.toBlock ||
            blockRange.fromBlock < fromBlock ||
            blockRange.toBlock > toBlock
          ) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isLoadingMore: false,
              hasMore: false,
            }));
            return;
          }

          // Fetch transactions for this block range
          newTransactions = await fetchTransactionsForBlockRange(
            provider,
            contract,
            blockRange.fromBlock,
            blockRange.toBlock,
            decimals,
            address
          );
        }

        // Determine if there are more pages
        // When filtering by address, we query all blocks so there are no more pages
        let hasMore = false;
        if (!address) {
          const blockRange = calculateBlockRange(
            currentPageNum,
            fromBlock,
            toBlock,
            reverseOrder
          );
          if (reverseOrder) {
            hasMore = blockRange.fromBlock > fromBlock;
          } else {
            hasMore = blockRange.toBlock < toBlock;
          }
        }

        // Update state
        if (loadMore) {
          setState((prev) => ({
            ...prev,
            transactions: [...prev.transactions, ...newTransactions],
            isLoadingMore: false,
            hasMore,
            currentPage: currentPageNum,
          }));
        } else {
          setState({
            transactions: newTransactions,
            isLoading: false,
            isLoadingMore: false,
            error: null,
            hasMore,
            currentPage: currentPageNum,
            totalCount: null, // Approximate count - can be calculated if needed
          });
        }
      } catch (error) {
        let errorMessage = "Failed to fetch transactions";

        if (error instanceof Error) {
          // Handle contract not found errors
          if (
            error.name === "ContractNotFoundError" ||
            error.message.includes(
              "Contract deployment block could not be found"
            )
          ) {
            errorMessage =
              "Contract not found. Please verify that the contract is deployed and the contract address is correct in your .env file (VITE_CONTRACT_ADDRESS).";
          } else if (
            error.message.includes("too many errors") ||
            error.message.includes("rate limit") ||
            error.message.includes("-32002") ||
            (error as any).code === -32002
          ) {
            errorMessage =
              "Too many requests to the RPC endpoint. Please wait a moment and try again. If using a local network, the node may be overwhelmed. Consider reducing the block range or waiting before retrying.";
          } else if (
            error.message.includes("CALL_EXCEPTION") ||
            error.message.includes("missing revert data")
          ) {
            errorMessage =
              "Cannot query transactions. The contract may not exist at this address, or the block range is invalid. Please verify the contract address and network connection.";
          } else if (
            error.message.includes("network") ||
            error.message.includes("Network")
          ) {
            errorMessage =
              "Network error occurred. Please check your connection and try again.";
          } else if (error.message.includes("MetaMask is not installed")) {
            errorMessage =
              "MetaMask is not installed or not available. Please install MetaMask and connect your wallet.";
          } else {
            errorMessage = error.message;
          }
        }

        setState((prev) => ({
          ...prev,
          isLoading: false,
          isLoadingMore: false,
          error: errorMessage,
        }));
      }
    },
    [
      publicClient,
      page,
      pageSize,
      dateRange,
      reverseOrder,
      address,
      state.currentPage,
      calculateBlockRange,
      fetchTransactionsForBlockRange,
      convertDateToBlock,
      clearBlockRangeCache,
    ]
  );

  // Fetch transactions on mount and when options change
  // Add a small delay on initial load to avoid overwhelming RPC with concurrent requests from multiple hooks
  useEffect(() => {
    if (!publicClient || !window.ethereum) return;

    // Delay initial fetch to allow other hooks (useAuth, useBalance, etc.) to complete their requests first
    const timeoutId = setTimeout(() => {
      fetchTransactions(false);
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    publicClient,
    page,
    pageSize,
    dateRange?.startDate?.getTime(),
    dateRange?.endDate?.getTime(),
    reverseOrder,
    address,
  ]);

  // Load more function
  const loadMore = useCallback(() => {
    fetchTransactions(true);
  }, [fetchTransactions]);

  return {
    ...state,
    refetch: () => fetchTransactions(false),
    loadMore,
    clearCache: clearBlockRangeCache,
  };
}
