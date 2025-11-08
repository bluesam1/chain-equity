import React from "react";
import { type TransactionType } from "../../hooks/useTransactionHistory";

export interface TransactionTypeBadgeProps {
  type: TransactionType;
  className?: string;
}

/**
 * Transaction type badge with icon and color coding
 */
export const TransactionTypeBadge: React.FC<TransactionTypeBadgeProps> = ({
  type,
  className = "",
}) => {
  const typeConfig = {
    Transfer: {
      label: "Transfer",
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      ),
    },
    Mint: {
      label: "Mint",
      color: "text-green-500 bg-green-500/10 border-green-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    Burn: {
      label: "Burn",
      color: "text-red-500 bg-red-500/10 border-red-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      ),
    },
    Split: {
      label: "Split",
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
    },
    SymbolChange: {
      label: "Symbol Change",
      color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    AllowlistUpdate: {
      label: "Allowlist Update",
      color: "text-gray-500 bg-gray-500/10 border-gray-500/20",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-md border
        ${config.color}
        ${className}
      `}
    >
      {config.icon}
      <span className="text-xs font-medium">{config.label}</span>
    </div>
  );
};
