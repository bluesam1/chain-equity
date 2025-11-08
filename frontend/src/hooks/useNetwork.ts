import { useChainId } from "wagmi";
import {
  isCorrectNetwork,
  getNetworkName,
  getNetworkStatusMessage,
  TARGET_CHAIN_ID,
} from "../lib/network";

export interface NetworkState {
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  networkName: string;
  statusMessage: string;
}

/**
 * Hook to get current network state and validation
 */
export function useNetwork(): NetworkState {
  const chainId = useChainId();

  return {
    chainId,
    isCorrectNetwork: isCorrectNetwork(chainId),
    networkName: getNetworkName(chainId),
    statusMessage: getNetworkStatusMessage(chainId),
  };
}

/**
 * Validate network before transactions
 * Throws error if wrong network
 */
export function validateNetwork(chainId: number | undefined): void {
  if (!isCorrectNetwork(chainId)) {
    throw new Error(
      `Wrong network detected. Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID})`
    );
  }
}
