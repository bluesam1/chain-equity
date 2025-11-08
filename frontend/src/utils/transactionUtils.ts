/**
 * Transaction formatting utilities
 */

/**
 * Format timestamp to human-readable format
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted timestamp string (e.g., "Dec 19, 2024 3:45 PM")
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Format address with truncation
 * @param address - Ethereum address
 * @param truncate - Whether to truncate the address (default: true)
 * @returns Formatted address string (e.g., "0x1234...5678" or full address)
 */
export function formatAddress(
  address: string,
  truncate: boolean = true
): string {
  if (!address) return "";
  if (!truncate || address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format amount with appropriate decimal precision
 * @param amount - Amount as string
 * @param decimals - Number of decimal places to show (default: 6)
 * @returns Formatted amount string
 */
export function formatAmount(
  amount: string | null,
  decimals: number = 6
): string {
  if (!amount) return "-";
  const num = parseFloat(amount);
  if (isNaN(num)) return "-";

  // Format with specified decimal places, but remove trailing zeros
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}
