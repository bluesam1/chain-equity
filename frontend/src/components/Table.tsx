import React, { useState } from "react";
import { WalletAddressPopover } from "./WalletAddressPopover";

export type TableVariant = "standard" | "sortable";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  sortType?: "string" | "number";
  render?: (value: unknown, row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
}

export interface TableProps<T = Record<string, unknown>> {
  variant?: TableVariant;
  columns: TableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  defaultSortColumn?: string;
  defaultSortDirection?: "asc" | "desc";
}

type SortDirection = "asc" | "desc" | null;

export function Table<T extends Record<string, unknown>>({
  variant = "standard",
  columns,
  data,
  isLoading = false,
  emptyMessage = "No data available",
  className = "",
  defaultSortColumn,
  defaultSortDirection = "desc",
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(
    defaultSortColumn || null
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSortColumn ? defaultSortDirection : null
  );

  const handleSort = (columnKey: string) => {
    if (variant !== "sortable") return;

    const column = columns.find((col) => col.key === columnKey);
    if (!column?.sortable) return;

    if (sortColumn === columnKey) {
      // Toggle direction
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    const column = columns.find((col) => col.key === sortColumn);
    const sortType = column?.sortType || "string";

    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      let comparison: number;

      if (sortType === "number") {
        // Handle numeric sorting (remove commas, %, and other non-numeric characters)
        const aNum = parseFloat(String(aValue).replace(/[^0-9.-]/g, "")) || 0;
        const bNum = parseFloat(String(bValue).replace(/[^0-9.-]/g, "")) || 0;
        comparison = aNum < bNum ? -1 : 1;
      } else {
        // String sorting (default)
        const aStr = String(aValue);
        const bStr = String(bValue);
        comparison = aStr < bStr ? -1 : 1;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const truncateAddress = (address: string, start = 4, end = 4) => {
    if (!address || address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderCell = (column: TableColumn<T>, row: T) => {
    const value = row[column.key];

    // Special handling for addresses
    if (
      typeof value === "string" &&
      value.startsWith("0x") &&
      value.length === 42
    ) {
      const truncated = truncateAddress(value);
      return (
        <WalletAddressPopover
          address={value}
          trigger={
            <span className="font-mono text-sm cursor-pointer">
              {truncated}
            </span>
          }
        />
      );
    }

    if (column.render) {
      return column.render(value, row);
    }

    return <span>{String(value)}</span>;
  };

  if (isLoading) {
    return (
      <div
        className={`bg-surface border border-border rounded-lg p-8 ${className}`}
      >
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div
        className={`bg-surface border border-border rounded-lg p-8 text-center ${className}`}
      >
        <p className="text-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface border border-border rounded-lg overflow-hidden ${className}`}
    >
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => {
              const isSortable = variant === "sortable" && column.sortable;
              const isSorted = sortColumn === column.key;
              const isAsc = sortDirection === "asc";
              const isDesc = sortDirection === "desc";

              return (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm font-semibold text-text-primary
                    ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left"
                    }
                    ${
                      isSortable
                        ? "cursor-pointer hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
                        : ""
                    }
                  `}
                  onClick={() => isSortable && handleSort(column.key)}
                  onKeyDown={(e) => {
                    if (isSortable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSort(column.key);
                    }
                  }}
                  tabIndex={isSortable ? 0 : undefined}
                  role={isSortable ? "button" : undefined}
                  aria-sort={
                    isSortable
                      ? isSorted
                        ? isAsc
                          ? "ascending"
                          : "descending"
                        : "none"
                      : undefined
                  }
                >
                  <div
                    className={`flex items-center gap-2 ${
                      column.align === "right"
                        ? "justify-end"
                        : column.align === "center"
                        ? "justify-center"
                        : "justify-start"
                    }`}
                  >
                    {column.label}
                    {isSortable && (
                      <span className="flex flex-col">
                        <svg
                          className={`w-3 h-3 ${
                            isSorted && isAsc
                              ? "text-primary"
                              : "text-text-muted"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                        <svg
                          className={`w-3 h-3 -mt-1 ${
                            isSorted && isDesc
                              ? "text-primary"
                              : "text-text-muted"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className="border-b border-border last:border-b-0 hover:bg-slate-700/50 transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm text-text-secondary
                    ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left"
                    }
                  `}
                >
                  {renderCell(column, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
