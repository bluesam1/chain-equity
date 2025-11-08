/**
 * Network Configuration
 *
 * Currently only supports Hardhat local dev-net (Chain ID 31337)
 * Future expansion prepared for testnet/mainnet support
 */

export const TARGET_CHAIN_ID = 31337; // Hardhat local network
export const TARGET_NETWORK_NAME = "Local Dev Network";
export const TARGET_RPC_URL = "http://localhost:8545";

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
}

export const networkConfig: NetworkConfig = {
  chainId: TARGET_CHAIN_ID,
  name: TARGET_NETWORK_NAME,
  rpcUrl: TARGET_RPC_URL,
  // No block explorer for local network
};

/**
 * Check if the given chain ID matches the target network
 */
export function isCorrectNetwork(chainId: number | undefined): boolean {
  return chainId === TARGET_CHAIN_ID;
}

/**
 * Get network display name
 */
export function getNetworkName(chainId: number | undefined): string {
  if (chainId === TARGET_CHAIN_ID) {
    return TARGET_NETWORK_NAME;
  }
  return "Unknown Network";
}

/**
 * Get network status message for tooltip
 */
export function getNetworkStatusMessage(chainId: number | undefined): string {
  if (chainId === TARGET_CHAIN_ID) {
    return `Chain ID: ${TARGET_CHAIN_ID}\nRPC: ${TARGET_RPC_URL}`;
  }
  return `Chain ID: ${
    chainId || "Unknown"
  }\nPlease switch to ${TARGET_NETWORK_NAME}`;
}
