/**
 * Supabase client initialization for Web3 authentication
 */

import { createClient, type Session } from "@supabase/supabase-js";

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
    // Supabase Web3 authentication uses the verify endpoint
    // We need to send the wallet address, signature, and message to Supabase
    const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        type: "web3",
        address: walletAddress.toLowerCase(),
        signature: signature,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message ||
          `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Set the session in the Supabase client
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    return {
      data: data.session,
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
