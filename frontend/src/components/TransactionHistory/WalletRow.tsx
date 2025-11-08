import React, { useState } from "react";
import { type WalletRow as WalletRowType } from "../../utils/transactionTransform";
import { TransactionTypeBadge } from "./TransactionTypeBadge";
import {
  formatTimestamp,
  formatAddress,
  formatAmount,
} from "../../utils/transactionUtils";
import { WalletAddressPopover } from "../WalletAddressPopover";

export interface WalletRowProps {
  walletRow: WalletRowType;
  onClick?: (transaction: WalletRowType["transaction"]) => void;
  linkedRowId?: string; // ID of the linked row (if this is part of a transfer pair)
  isLinked?: boolean; // Whether this row is part of a linked pair
}

/**
 * Wallet row component - displays one wallet address per row
 * For transfers, rows are visually linked to show sender/recipient relationship
 */
export const WalletRow: React.FC<WalletRowProps> = ({
  walletRow,
  onClick,
  linkedRowId,
  isLinked = false,
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
      onClick(walletRow.transaction);
    }
  };

  const copyAddress = async (e: React.MouseEvent, address: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Determine role label for display
  const getRoleLabel = (): string => {
    if (walletRow.role === "sender") return "From";
    if (walletRow.role === "recipient") return "To";
    if (walletRow.role === "mint-recipient") return "To";
    if (walletRow.role === "system-event") return "Event";
    return "";
  };

  // Get the opposite address for display context (for transfers)
  const getOppositeAddress = (): string | null => {
    const { transaction, role } = walletRow;
    if (role === "sender" && transaction.to) return transaction.to;
    if (role === "recipient" && transaction.from) return transaction.from;
    return null;
  };

  const oppositeAddress = getOppositeAddress();
  const isTransfer = walletRow.transaction.type === "Transfer";
  const isSplit = walletRow.transaction.type === "Split";
  const isSystemEvent = walletRow.role === "system-event";

  return (
    <tr
      onClick={handleRowClick}
      className={`
        border-b border-border transition-colors group
        ${onClick ? "cursor-pointer hover:bg-slate-800/50" : ""}
        ${isLinked ? "bg-slate-900/20" : ""}
        ${
          isLinked && walletRow.role === "sender"
            ? "border-l-2 border-l-red-500/60"
            : ""
        }
        ${
          isLinked && walletRow.role === "recipient"
            ? "border-l-2 border-l-green-500/60"
            : ""
        }
        ${isLinked ? "hover:bg-slate-800/60" : ""}
        ${isSystemEvent ? "bg-blue-900/10" : ""}
      `}
      data-linked-row-id={linkedRowId}
      data-row-id={walletRow.id}
    >
      {/* Type */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <TransactionTypeBadge type={walletRow.transaction.type} />
          {isLinked && (
            <span
              className={`text-xs font-semibold ${
                walletRow.role === "sender"
                  ? "text-red-500/70"
                  : "text-green-500/70"
              }`}
            >
              {walletRow.role === "sender" ? "→" : "←"}
            </span>
          )}
        </div>
      </td>

      {/* Timestamp */}
      <td className="px-4 py-3 text-sm text-text-primary">
        {formatTimestamp(walletRow.transaction.timestamp)}
      </td>

      {/* Block Number */}
      <td className="px-4 py-3 text-sm text-text-secondary font-mono">
        #{walletRow.transaction.blockNumber}
      </td>

      {/* Wallet Address */}
      <td className="px-4 py-3 text-sm">
        {isSystemEvent && isSplit ? (
          <div className="flex flex-col gap-1">
            <span className="text-text-secondary font-semibold">
              Stock Split
            </span>
            <span className="text-xs text-text-muted">
              Multiplier: {walletRow.transaction.eventData.multiplier || "N/A"}x
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted font-medium">
                {getRoleLabel()}:
              </span>
              <WalletAddressPopover
                address={walletRow.address}
                trigger={
                  <span
                    className="font-mono text-text-primary hover:text-primary cursor-pointer"
                    onClick={(e) => handleAddressClick(e, walletRow.address)}
                    title={walletRow.address}
                  >
                    {formatAddress(
                      walletRow.address,
                      !showFullAddress[walletRow.address]
                    )}
                  </span>
                }
              />
            </div>
            {/* Show opposite address for transfers - smaller, muted */}
            {isTransfer && oppositeAddress && (
              <div className="flex items-center gap-2 text-xs text-text-muted pl-4">
                <span className="text-text-muted/70">
                  {walletRow.role === "sender" ? "To:" : "From:"}
                </span>
                <WalletAddressPopover
                  address={oppositeAddress}
                  trigger={
                    <span
                      className="font-mono text-text-secondary hover:text-primary/80 cursor-pointer"
                      onClick={(e) => handleAddressClick(e, oppositeAddress)}
                      title={oppositeAddress}
                    >
                      {formatAddress(
                        oppositeAddress,
                        !showFullAddress[oppositeAddress]
                      )}
                    </span>
                  }
                />
              </div>
            )}
          </div>
        )}
      </td>

      {/* Amount */}
      <td className="px-4 py-3 text-sm text-text-primary font-mono text-right">
        {walletRow.transaction.amount
          ? formatAmount(walletRow.transaction.amount)
          : "-"}
      </td>

      {/* Transaction Hash */}
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-text-secondary hover:text-primary cursor-pointer"
            onClick={(e) => handleAddressClick(e, walletRow.transaction.hash)}
            title={walletRow.transaction.hash}
          >
            {formatAddress(
              walletRow.transaction.hash,
              !showFullAddress[walletRow.transaction.hash]
            )}
          </span>
          <button
            onClick={(e) => copyAddress(e, walletRow.transaction.hash)}
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
