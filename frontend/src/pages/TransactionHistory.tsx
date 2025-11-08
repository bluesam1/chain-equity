import React, { useState, useEffect } from "react";
import { Card, StatusIndicator } from "../components";
import {
  useTransactionHistory,
  type Transaction,
} from "../hooks/useTransactionHistory";
import { TransactionList } from "../components/TransactionHistory/TransactionList";
import { TransactionFilters } from "../components/TransactionHistory/TransactionFilters";
import { useTabNavigation } from "../contexts/TabNavigationContext";

export const TransactionHistory: React.FC = () => {
  const {
    transactionHistoryAddress,
    clearTransactionHistoryAddress,
    activeTabId,
  } = useTabNavigation();
  const [addressFilter, setAddressFilter] = useState<string | null>(null);

  // Apply address from context when navigating from popover
  useEffect(() => {
    if (transactionHistoryAddress) {
      setAddressFilter(transactionHistoryAddress);
      // Clear the context address after applying it
      clearTransactionHistoryAddress();
    }
  }, [transactionHistoryAddress, clearTransactionHistoryAddress]);

  // Clear address filter when switching away from this tab
  useEffect(() => {
    if (activeTabId !== "transaction-history") {
      setAddressFilter(null);
    }
  }, [activeTabId]);

  const {
    transactions,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refetch,
    loadMore,
  } = useTransactionHistory({
    page: 1,
    pageSize: 50,
    reverseOrder: true,
    address: addressFilter,
  });

  const handleTransactionClick = (transaction: Transaction) => {
    // TODO: Open transaction detail modal (Story 1.9)
    console.log("Transaction clicked:", transaction);
  };

  const handleAddressChange = (address: string | null) => {
    setAddressFilter(address);
  };

  return (
    <div className="space-y-6">
      {/* Transaction History Header */}
      <Card variant="standard">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Transaction History
          </h2>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Refresh
          </button>
        </div>
      </Card>

      {/* Filters Section */}
      <Card variant="standard">
        <h3 className="text-md font-semibold text-text-primary mb-4">
          Filters
        </h3>
        <TransactionFilters
          address={addressFilter}
          onAddressChange={handleAddressChange}
        />
      </Card>

      {/* Error State */}
      {error && !isLoading && (
        <StatusIndicator
          variant="error"
          message={error}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: refetch,
          }}
        />
      )}

      {/* Transaction List */}
      {!error && (
        <Card variant="standard">
          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            onTransactionClick={handleTransactionClick}
            onLoadMore={loadMore}
            enableInfiniteScroll={true}
            filterAddress={addressFilter}
          />
        </Card>
      )}
    </div>
  );
};
