/**
 * Supabase client initialization for Web3 authentication
 */

import { createClient, type Session } from "@supabase/supabase-js";
import { ethers } from "ethers";

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env.local file."
  );
}

/**
 * Supabase client instance
 * Used for Web3 authentication and session management
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Web3 authentication configuration
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/**
 * Web3 Authentication Helper Functions
 */

/**
 * Generate authentication message for wallet signing
 * This message will be signed by the user's wallet to prove ownership
 *
 * @param walletAddress - The wallet address that will sign the message
 * @returns Message string to be signed
 */
export function generateAuthMessage(walletAddress: string): string {
  const timestamp = Date.now();
  return `Sign this message to authenticate with Chain Equity.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
}

/**
 * Sign in with wallet address
 * User signs a message to prove wallet ownership
 *
 * @param walletAddress - The wallet address to authenticate
 * @param signature - The signature of the message
 * @param message - The message that was signed
 * @returns Promise with session data
 */
export async function signInWithWallet(
  walletAddress: string,
  signature: string,
  message: string
) {
  try {
    // For local development, we'll use a simplified authentication
    // that just verifies the signature and creates a local session
    // Supabase Web3 auth requires a custom backend implementation

    // Verify signature locally using ethers
    const provider = new ethers.BrowserProvider(window.ethereum!);
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      throw new Error("Signature verification failed");
    }

    // Create a simple session object for local development
    // In production, this would be handled by Supabase with a custom backend
    const session = {
      access_token: `local_${walletAddress}_${Date.now()}`,
      refresh_token: `local_refresh_${walletAddress}_${Date.now()}`,
      user: {
        id: walletAddress,
        address: walletAddress,
      },
    };

    // Store in localStorage for session persistence
    localStorage.setItem(
      "walletSession",
      JSON.stringify({
        address: walletAddress,
        signature,
        message,
        timestamp: Date.now(),
      })
    );

    return {
      data: session,
      error: null,
    };
  } catch (error) {
    console.error("Error signing in with wallet:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

/**
 * Get current session
 * @returns Current session or null
 */
export async function getCurrentSession() {
  // For local development, check localStorage first
  const walletSession = localStorage.getItem("walletSession");
  if (walletSession) {
    try {
      const sessionData = JSON.parse(walletSession);
      // Check if session is still valid (24 hours)
      if (Date.now() - sessionData.timestamp < 24 * 60 * 60 * 1000) {
        return {
          access_token: `local_${sessionData.address}_${sessionData.timestamp}`,
          refresh_token: `local_refresh_${sessionData.address}_${sessionData.timestamp}`,
          user: {
            id: sessionData.address,
            address: sessionData.address,
          },
        };
      }
    } catch (error) {
      // Fall through to Supabase check
    }
  }

  // Fallback to Supabase session check
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Error getting session:", error);
    return null;
  }

  return session;
}

/**
 * Get current user
 * @returns Current user or null
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Error getting user:", error);
    return null;
  }

  return user;
}

/**
 * Sign out current user
 */
export async function signOut() {
  // Clear local session
  localStorage.removeItem("walletSession");

  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 * @param callback - Callback function to handle auth state changes
 * @returns Unsubscribe function
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}
