import React, { useEffect, useRef, useCallback, useMemo } from "react";
import { type Transaction } from "../../hooks/useTransactionHistory";
import { WalletRow } from "./WalletRow";
import { transformTransactionsToWalletRows } from "../../utils/transactionTransform";
import { StatusIndicator } from "../StatusIndicator";
import { Button } from "../Button";

export interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onLoadMore?: () => void;
  enableInfiniteScroll?: boolean;
  filterAddress?: string | null; // Address to filter wallet rows by
}

/**
 * Transaction list component with infinite scroll support
 */
export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onTransactionClick,
  onLoadMore,
  enableInfiniteScroll = true,
  filterAddress = null,
}) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!enableInfiniteScroll || !onLoadMore || !hasMore || isLoadingMore) {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: "200px", // Trigger 200px before bottom
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableInfiniteScroll, onLoadMore, hasMore, isLoadingMore]);

  const handleLoadMore = useCallback(() => {
    if (onLoadMore && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, isLoadingMore]);

  // Transform transactions to wallet rows
  const walletRows = useMemo(() => {
    return transformTransactionsToWalletRows(transactions, filterAddress);
  }, [transactions, filterAddress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <StatusIndicator
          variant="pending"
          message="Loading transactions..."
          display="inline"
        />
      </div>
    );
  }

  if (walletRows.length === 0 && !isLoadingMore) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Block
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Wallet Address
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Hash
              </th>
            </tr>
          </thead>
          <tbody>
            {walletRows.map((walletRow) => (
              <WalletRow
                key={walletRow.id}
                walletRow={walletRow}
                onClick={onTransactionClick}
                linkedRowId={walletRow.linkedRowId}
                isLinked={walletRow.isLinked}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Infinite scroll trigger */}
      {enableInfiniteScroll && <div ref={loadMoreRef} className="h-4" />}

      {/* Load More Button */}
      {onLoadMore && (
        <div className="flex items-center justify-center py-4">
          {isLoadingMore ? (
            <StatusIndicator
              variant="pending"
              message="Loading more transactions..."
              display="inline"
            />
          ) : hasMore ? (
            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              Load More
            </Button>
          ) : (
            <p className="text-text-muted text-sm">
              No more transactions to load
            </p>
          )}
        </div>
      )}
    </div>
  );
};
