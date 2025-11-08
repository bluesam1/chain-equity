import { type Transaction } from "../hooks/useTransactionHistory";

/**
 * Wallet row role in a transaction
 */
export type WalletRole =
  | "sender"
  | "recipient"
  | "mint-recipient"
  | "system-event";

/**
 * Wallet row interface - represents one wallet address in a transaction
 */
export interface WalletRow {
  id: string; // Unique ID for React key (transactionHash-role)
  transaction: Transaction; // Reference to original transaction
  address: string; // The wallet address for this row
  role: WalletRole; // Role of this wallet in the transaction
  linkedRowId?: string; // For transfers: ID of the paired row (sender <-> recipient)
  isLinked: boolean; // Whether this row is part of a linked pair
}

/**
 * Transform transactions into wallet rows
 * - Mint: Creates 1 row (recipient only)
 * - Transfer: Creates 2 rows (sender + recipient) with linkedRowId
 * - Other types: Creates rows based on available addresses
 *
 * @param transactions - Array of transactions to transform
 * @param filterAddress - Optional address to filter wallet rows by (only show rows for this address)
 */
export function transformTransactionsToWalletRows(
  transactions: Transaction[],
  filterAddress?: string | null
): WalletRow[] {
  const walletRows: WalletRow[] = [];

  transactions.forEach((transaction) => {
    const { type, hash, from, to } = transaction;

    // Helper to check if address matches filter (case-insensitive)
    const matchesFilter = (address: string | null): boolean => {
      if (!filterAddress || !address) return true;
      return address.toLowerCase() === filterAddress.toLowerCase();
    };

    if (type === "Split") {
      // Split: System event with no specific address (show if no filter, or always show)
      if (!filterAddress) {
        walletRows.push({
          id: `${hash}-split`,
          transaction,
          address: "", // No specific address for splits
          role: "system-event",
          isLinked: false,
        });
      }
    } else if (type === "Mint") {
      // Mint: Only show recipient (to address)
      if (to && matchesFilter(to)) {
        walletRows.push({
          id: `${hash}-mint-recipient`,
          transaction,
          address: to,
          role: "mint-recipient",
          isLinked: false,
        });
      }
    } else if (type === "Transfer") {
      // Transfer: Show recipient first, then sender (TO before FROM)
      if (from && to) {
        const senderId = `${hash}-sender`;
        const recipientId = `${hash}-recipient`;
        const showSender = matchesFilter(from);
        const showRecipient = matchesFilter(to);

        // Only create rows for addresses that match the filter
        // Recipient (TO) first, then sender (FROM)
        if (showRecipient) {
          walletRows.push({
            id: recipientId,
            transaction,
            address: to,
            role: "recipient",
            linkedRowId: senderId,
            isLinked: true,
          });
        }

        if (showSender) {
          walletRows.push({
            id: senderId,
            transaction,
            address: from,
            role: "sender",
            linkedRowId: recipientId,
            isLinked: true,
          });
        }
      } else if (to && matchesFilter(to)) {
        // Fallback: Only recipient available
        walletRows.push({
          id: `${hash}-recipient`,
          transaction,
          address: to,
          role: "recipient",
          isLinked: false,
        });
      } else if (from && matchesFilter(from)) {
        // Fallback: Only sender available
        walletRows.push({
          id: `${hash}-sender`,
          transaction,
          address: from,
          role: "sender",
          isLinked: false,
        });
      }
    } else {
      // Other transaction types: Show available addresses that match filter
      // Priority: to > from
      if (to && matchesFilter(to)) {
        walletRows.push({
          id: `${hash}-recipient`,
          transaction,
          address: to,
          role: "recipient",
          isLinked: false,
        });
      } else if (from && matchesFilter(from)) {
        walletRows.push({
          id: `${hash}-sender`,
          transaction,
          address: from,
          role: "sender",
          isLinked: false,
        });
      }
    }
  });

  return walletRows;
}
