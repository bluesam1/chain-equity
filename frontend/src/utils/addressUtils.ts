/**
 * Address validation utilities
 */

/**
 * Validate Ethereum address format
 * @param address - Address string to validate
 * @returns True if address is valid Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Normalize Ethereum address (convert to checksum format)
 * @param address - Address string to normalize
 * @returns Normalized address or null if invalid
 */
export function normalizeAddress(address: string): string | null {
  if (!isValidEthereumAddress(address)) {
    return null;
  }
  // For now, just return lowercase version
  // In the future, could implement EIP-55 checksum validation
  return address.toLowerCase();
}

