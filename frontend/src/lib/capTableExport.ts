import type { CapTableEntry } from "../hooks/useCapTable";

export type ExportFormat = "csv" | "json";

export interface ExportOptions {
  format: ExportFormat;
  blockNumber?: number;
  totalSupply?: string;
  timestamp?: number;
}

/**
 * Convert cap table entries to CSV format
 */
export function formatCapTableAsCSV(
  entries: CapTableEntry[],
  options: ExportOptions
): string {
  const headers = ["Address", "Balance", "Ownership %"];
  const rows = entries.map((entry) => [
    entry.address,
    entry.balance,
    entry.percentage,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Convert cap table entries to JSON format
 */
export function formatCapTableAsJSON(
  entries: CapTableEntry[],
  options: ExportOptions
): string {
  const data = {
    metadata: {
      blockNumber: options.blockNumber || null,
      totalSupply: options.totalSupply || null,
      timestamp: options.timestamp || null,
      exportDate: new Date().toISOString(),
      totalHolders: entries.length,
    },
    holders: entries.map((entry) => ({
      address: entry.address,
      balance: entry.balance,
      percentage: entry.percentage,
    })),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Trigger file download
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export cap table data
 */
export function exportCapTable(
  entries: CapTableEntry[],
  format: ExportFormat,
  options: ExportOptions = { format }
): void {
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === "csv") {
    content = formatCapTableAsCSV(entries, options);
    filename = `cap-table-${options.blockNumber || "latest"}-${Date.now()}.csv`;
    mimeType = "text/csv";
  } else {
    content = formatCapTableAsJSON(entries, options);
    filename = `cap-table-${
      options.blockNumber || "latest"
    }-${Date.now()}.json`;
    mimeType = "application/json";
  }

  downloadFile(content, filename, mimeType);
}
