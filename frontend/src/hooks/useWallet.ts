import { useEffect, useState, useRef } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { TARGET_CHAIN_ID, isCorrectNetwork } from "../lib/network";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export type WalletState =
  | "disconnected"
  | "connected"
  | "wrong-network"
  | "locked"
  | "error";

export interface WalletConnectionState {
  state: WalletState;
  address: string | undefined;
  chainId: number | undefined;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const { address, isConnected, isConnecting: wagmiConnecting } = useAccount();
  const { connect, connectors, error: connectError, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const [state, setState] = useState<WalletState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Track if we've already attempted to auto-reconnect to prevent multiple prompts
  const hasAttemptedAutoReconnect = useRef(false);
  const isConnectionInProgress = useRef(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled =
    typeof window !== "undefined" &&
    typeof window.ethereum !== "undefined" &&
    window.ethereum.isMetaMask;

  // Validate network
  useEffect(() => {
    if (isConnected && address) {
      if (isCorrectNetwork(chainId)) {
        setState("connected");
        setError(null);
        // Store connection state
        localStorage.setItem("walletConnected", "true");
        localStorage.setItem("walletAddress", address);
      } else {
        setState("wrong-network");
        setError(
          `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID})`
        );
      }
    } else {
      setState("disconnected");
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("walletAddress");
    }
  }, [isConnected, address, chainId]);

  // Handle connection errors
  useEffect(() => {
    if (connectError) {
      if (
        connectError.message.includes("rejected") ||
        connectError.message.includes("User rejected")
      ) {
        setError(null); // User rejection is not an error
        setState("disconnected");
      } else if (connectError.message.includes("locked")) {
        setError("Please unlock your wallet in MetaMask");
        setState("locked");
      } else {
        setError(connectError.message);
        setState("error");
      }
      setIsConnecting(false);
      isConnectionInProgress.current = false;
    }
  }, [connectError]);

  // Reset connection in progress flag when connection succeeds
  useEffect(() => {
    if (isConnected && address) {
      isConnectionInProgress.current = false;
    }
  }, [isConnected, address]);

  // Restore connection on mount - only attempt once
  useEffect(() => {
    // Only attempt auto-reconnect if:
    // 1. We haven't already attempted it
    // 2. We're not already connected
    // 3. We're not already attempting to connect
    // 4. There was a previous connection saved
    if (
      hasAttemptedAutoReconnect.current ||
      isConnected ||
      isConnectionInProgress.current
    ) {
      return;
    }

    const wasConnected = localStorage.getItem("walletConnected") === "true";
    const savedAddress = localStorage.getItem("walletAddress");

    if (wasConnected && savedAddress) {
      // Mark that we've attempted auto-reconnect
      hasAttemptedAutoReconnect.current = true;
      isConnectionInProgress.current = true;

      // Try to reconnect
      const metaMaskConnector = connectors.find((c) => c.id === "metaMask");
      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector });
      } else {
        // If connector not available yet, reset the flag so we can try again
        hasAttemptedAutoReconnect.current = false;
        isConnectionInProgress.current = false;
      }
    }
  }, [connectors, connect, isConnected]);

  const connectWallet = async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectionInProgress.current || isConnected) {
      return;
    }

    if (!isMetaMaskInstalled) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      setState("error");
      return;
    }

    isConnectionInProgress.current = true;
    setIsConnecting(true);
    setError(null);

    try {
      // Wait for connectors to be available (with retry logic)
      let metaMaskConnector = connectors.find(
        (c) => c.id === "metaMask" || c.name === "MetaMask"
      );

      if (!metaMaskConnector && connectors.length === 0) {
        // If connectors aren't loaded yet, wait a bit and try again
        await new Promise((resolve) => setTimeout(resolve, 200));
        metaMaskConnector = connectors.find(
          (c) => c.id === "metaMask" || c.name === "MetaMask"
        );
      }

      if (!metaMaskConnector) {
        throw new Error(
          "MetaMask connector not found. Please refresh the page and try again."
        );
      }

      connect({ connector: metaMaskConnector });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMessage);
      setState("error");
      setIsConnecting(false);
      isConnectionInProgress.current = false;
    }
  };

  const switchToCorrectNetwork = async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed");
      throw new Error("MetaMask is not installed");
    }

    try {
      // First, try to switch to the network
      await switchChain({ chainId: TARGET_CHAIN_ID });
    } catch (switchError: any) {
      // If switch fails, the network might not be added to MetaMask
      // Try to add it first
      if (
        switchError?.code === 4902 ||
        switchError?.message?.includes("Unrecognized chain")
      ) {
        try {
          // Add the Hardhat network to MetaMask
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${TARGET_CHAIN_ID.toString(16)}`, // Convert to hex
                chainName: "Local Dev Network",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: ["http://localhost:8545"],
              },
            ],
          });
          // After adding, try switching again
          await switchChain({ chainId: TARGET_CHAIN_ID });
        } catch (addError) {
          const errorMessage =
            addError instanceof Error
              ? addError.message
              : "Failed to add network to MetaMask";
          setError(errorMessage);
          throw addError;
        }
      } else {
        const errorMessage =
          switchError instanceof Error
            ? switchError.message
            : "Failed to switch network";
        setError(errorMessage);
        throw switchError;
      }
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setState("disconnected");
    setError(null);
    localStorage.removeItem("walletConnected");
    localStorage.removeItem("walletAddress");
    // Reset flags so user can reconnect
    hasAttemptedAutoReconnect.current = false;
    isConnectionInProgress.current = false;
  };

  return {
    state: isConnecting ? "disconnected" : state,
    address,
    chainId,
    isConnecting: isConnecting || wagmiConnecting || isPending,
    error,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
  };
}
