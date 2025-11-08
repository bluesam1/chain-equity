import React, { useState } from "react";
import { type Transaction } from "../../hooks/useTransactionHistory";
import { TransactionTypeBadge } from "./TransactionTypeBadge";
import {
  formatTimestamp,
  formatAddress,
  formatAmount,
} from "../../utils/transactionUtils";
import { WalletAddressPopover } from "../WalletAddressPopover";

export interface TransactionRowProps {
  transaction: Transaction;
  onClick?: (transaction: Transaction) => void;
}

/**
 * Transaction row component
 */
export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onClick,
}) => {
  const [showFullAddress, setShowFullAddress] = useState<{
    [key: string]: boolean;
  }>({});

  const handleAddressClick = (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    setShowFullAddress((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const handleRowClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      className={`
        border-b border-border hover:bg-slate-800/50 transition-colors
        ${onClick ? "cursor-pointer" : ""}
      `}
    >
      {/* Type */}
      <td className="px-4 py-3">
        <TransactionTypeBadge type={transaction.type} />
      </td>

      {/* Timestamp */}
      <td className="px-4 py-3 text-sm text-text-primary">
        {formatTimestamp(transaction.timestamp)}
      </td>

      {/* Block Number */}
      <td className="px-4 py-3 text-sm text-text-secondary font-mono">
        #{transaction.blockNumber}
      </td>

      {/* From Address */}
      <td className="px-4 py-3 text-sm">
        {transaction.from ? (
          <WalletAddressPopover
            address={transaction.from}
            trigger={
              <span
                className="font-mono text-text-primary hover:text-primary cursor-pointer"
                onClick={(e) => handleAddressClick(e, transaction.from!)}
                title={transaction.from}
              >
                {formatAddress(
                  transaction.from,
                  !showFullAddress[transaction.from]
                )}
              </span>
            }
          />
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </td>

      {/* To Address */}
      <td className="px-4 py-3 text-sm">
        {transaction.to ? (
          <WalletAddressPopover
            address={transaction.to}
            trigger={
              <span
                className="font-mono text-text-primary hover:text-primary cursor-pointer"
                onClick={(e) => handleAddressClick(e, transaction.to!)}
                title={transaction.to}
              >
                {formatAddress(
                  transaction.to,
                  !showFullAddress[transaction.to]
                )}
              </span>
            }
          />
        ) : (
          <span className="text-text-muted">-</span>
        )}
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-sm text-text-primary font-mono text-right">
        {transaction.amount ? formatAmount(transaction.amount) : "-"}
      </td>

      {/* Transaction Hash */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-text-secondary hover:text-primary cursor-pointer"
            onClick={(e) => handleAddressClick(e, transaction.hash)}
            title={transaction.hash}
          >
            {formatAddress(
              transaction.hash,
              !showFullAddress[transaction.hash]
            )}
          </span>
          <button
            onClick={(e) => copyAddress(e, transaction.hash)}
            className="text-text-secondary hover:text-primary text-xs"
            title="Copy transaction hash"
          >
            📋
          </button>
        </div>
      </td>
    </tr>
  );
};
