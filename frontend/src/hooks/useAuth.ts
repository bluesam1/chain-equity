import { useEffect, useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { ethers } from "ethers";
import {
  generateAuthMessage,
  signInWithWallet,
  getCurrentSession,
  signOut as supabaseSignOut,
  onAuthStateChange,
} from "../lib/supabase";
import { isCorrectNetwork, TARGET_CHAIN_ID } from "../lib/network";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      isMetaMask?: boolean;
    };
  }
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  session: any | null;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Check if user has admin role on-chain
 */
async function checkAdminRole(
  address: string,
  provider: ethers.Provider
): Promise<boolean> {
  if (!CONTRACT_ADDRESS) {
    console.warn("Contract address not configured");
    return false;
  }

  try {
    // Get contract ABI for hasRole function
    const contractABI = [
      "function hasRole(bytes32 role, address account) view returns (bool)",
    ];

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      contractABI,
      provider
    );
    const hasAdminRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, address);
    return hasAdminRole;
  } catch (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
}

/**
 * Hook for Supabase Web3 authentication
 */
export function useAuth() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
    error: null,
    session: null,
  });

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: true,
            session,
            isLoading: false,
          }));
        } else {
          setAuthState((prev) => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
          }));
        }
      } catch (error) {
        setAuthState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Failed to check session",
          isLoading: false,
        }));
      }
    };

    checkSession();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = onAuthStateChange((_event, session) => {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: !!session,
        session,
      }));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check admin role when wallet is connected
  useEffect(() => {
    const checkAdmin = async () => {
      if (!isConnected || !address) {
        setAuthState((prev) => ({ ...prev, isAdmin: false }));
        return;
      }

      try {
        // Get provider from wagmi
        const provider = new ethers.BrowserProvider(window.ethereum);
        const isAdmin = await checkAdminRole(address, provider);
        setAuthState((prev) => ({ ...prev, isAdmin }));
      } catch (error) {
        console.error("Error checking admin role:", error);
        setAuthState((prev) => ({ ...prev, isAdmin: false }));
      }
    };

    if (isConnected && address) {
      checkAdmin();
    }
  }, [isConnected, address]);

  /**
   * Authenticate with Supabase using wallet signature
   */
  const authenticate = async () => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    // Check wallet connection directly from window.ethereum
    if (!window.ethereum) {
      throw new Error("MetaMask is not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Check and switch network if needed
    const network = await provider.getNetwork();
    const currentChainId = Number(network.chainId);

    if (!isCorrectNetwork(currentChainId)) {
      // Try to switch to the correct network automatically
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${TARGET_CHAIN_ID.toString(16)}` }],
        });
        // Wait a bit for the switch to complete, then re-check
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const newNetwork = await provider.getNetwork();
        if (!isCorrectNetwork(Number(newNetwork.chainId))) {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      } catch (switchError: any) {
        // If switch fails, try to add the network
        if (
          switchError?.code === 4902 ||
          switchError?.message?.includes("Unrecognized chain")
        ) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${TARGET_CHAIN_ID.toString(16)}`,
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
            // Wait a bit for the network to be added
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (addError) {
            throw new Error(
              `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask. The network will be added automatically.`
            );
          }
        } else if (switchError?.code === 4001) {
          // User rejected the switch
          throw new Error(
            "Network switch was rejected. Please switch to Local Dev Network (Chain ID 31337) manually in MetaMask."
          );
        } else {
          throw new Error(
            `Please switch to Local Dev Network (Chain ID ${TARGET_CHAIN_ID}) in MetaMask`
          );
        }
      }
    }

    setAuthState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Generate authentication message
      const message = generateAuthMessage(address);

      // Request signature from wallet using ethers directly
      // This avoids wagmi connector issues
      // Re-create provider after network switch to ensure we have the latest network
      const updatedProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await updatedProvider.getSigner();
      const signature = await signer.signMessage(message);

      // Authenticate with Supabase
      const { data: session, error } = await signInWithWallet(
        address,
        signature,
        message
      );

      if (error) {
        throw error;
      }

      // Check admin role (reuse the provider from above)
      const isAdmin = await checkAdminRole(address, updatedProvider);

      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        isAdmin,
        error: null,
        session,
      });

      // Store session in localStorage
      if (session) {
        localStorage.setItem("supabaseSession", JSON.stringify(session));
      }

      return { session, isAdmin };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Authentication failed";
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      }));
      throw error;
    }
  };

  /**
   * Sign out from Supabase
   */
  const signOut = async () => {
    try {
      await supabaseSignOut();
      localStorage.removeItem("supabaseSession");
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        isAdmin: false,
        error: null,
        session: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sign out failed";
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
      throw error;
    }
  };

  return {
    ...authState,
    authenticate,
    signOut,
  };
}
