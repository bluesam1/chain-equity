import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  findBlockByTimestamp,
  FutureDateError,
  BeforeDeploymentError,
  ContractNotFoundError,
  type BlockLookupResult,
  type ProgressCallback,
} from "../lib/blockLookup";

/**
 * Status of block lookup operation
 */
export type BlockLookupStatus = "idle" | "loading" | "success" | "error";

/**
 * Progress information during block lookup
 */
export interface BlockLookupProgress {
  currentBlock: number;
  minBlock: number;
  maxBlock: number;
}

/**
 * State for block lookup hook
 */
export interface BlockLookupState {
  status: BlockLookupStatus;
  error: string | null;
  result: BlockLookupResult | null;
  progress: BlockLookupProgress | null;
  timezone: string;
}

/**
 * Hook for block lookup by date/time functionality
 *
 * @returns Block lookup state and functions
 */
export function useBlockLookup() {
  // Detect browser timezone
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [state, setState] = useState<BlockLookupState>({
    status: "idle",
    error: null,
    result: null,
    progress: null,
    timezone: browserTimezone,
  });

  /**
   * Convert local date/time string to Unix timestamp (UTC)
   *
   * @param dateTimeString - Date/time string in format "YYYY-MM-DDTHH:mm" (local timezone)
   * @returns Unix timestamp in seconds (UTC)
   */
  const convertLocalDateTimeToUnixTimestamp = useCallback(
    (dateTimeString: string): number => {
      // Create Date object from local date/time string
      // The Date constructor interprets the string as local time
      const localDate = new Date(dateTimeString);

      // Get Unix timestamp in seconds
      return Math.floor(localDate.getTime() / 1000);
    },
    []
  );

  /**
   * Convert Unix timestamp (UTC) to local date/time string
   *
   * @param unixTimestamp - Unix timestamp in seconds (UTC)
   * @returns Date/time string in format "YYYY-MM-DDTHH:mm" (local timezone)
   */
  const convertUnixTimestampToLocalDateTime = useCallback(
    (unixTimestamp: number): string => {
      // Create Date object from Unix timestamp (milliseconds)
      const date = new Date(unixTimestamp * 1000);

      // Format as YYYY-MM-DDTHH:mm (local timezone)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    },
    []
  );

  /**
   * Convert error to user-friendly message
   *
   * @param error - Error object
   * @returns User-friendly error message
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    if (error instanceof FutureDateError) {
      return "The selected date/time is in the future. Please select a past date.";
    }
    if (error instanceof BeforeDeploymentError) {
      return "The selected date/time is before the contract was deployed. Please select a later date.";
    }
    if (error instanceof ContractNotFoundError) {
      return "Contract deployment block could not be found. Please verify the contract address is correct.";
    }
    if (error instanceof Error) {
      if (
        error.message.includes("network") ||
        error.message.includes("Network")
      ) {
        return "Network error occurred. Please check your connection and try again.";
      }
      if (
        error.message.includes("rate limit") ||
        error.message.includes("too many")
      ) {
        return "Too many requests. Please wait a moment and try again.";
      }
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  }, []);

  /**
   * Lookup block number by date/time
   *
   * @param dateTimeString - Date/time string in format "YYYY-MM-DDTHH:mm" (local timezone)
   * @returns Promise that resolves when lookup is complete
   */
  const lookupBlock = useCallback(
    async (dateTimeString: string): Promise<void> => {
      if (!window.ethereum) {
        setState((prev) => ({
          ...prev,
          status: "error",
          error: "Wallet provider not available",
          progress: null,
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        status: "loading",
        error: null,
        result: null,
        progress: null,
      }));

      try {
        // Convert local date/time to Unix timestamp (UTC)
        const targetTimestamp =
          convertLocalDateTimeToUnixTimestamp(dateTimeString);

        // Create provider
        const provider = new ethers.BrowserProvider(window.ethereum);

        // Progress callback for binary search
        const progressCallback: ProgressCallback = (
          currentBlock,
          minBlock,
          maxBlock
        ) => {
          setState((prev) => ({
            ...prev,
            progress: {
              currentBlock,
              minBlock,
              maxBlock,
            },
          }));
        };

        // Find block by timestamp
        const result = await findBlockByTimestamp(
          provider,
          targetTimestamp,
          progressCallback
        );

        // Convert block timestamp back to local date/time for display
        const localDateTime = convertUnixTimestampToLocalDateTime(
          result.timestamp
        );

        setState((prev) => ({
          ...prev,
          status: "success",
          error: null,
          result: {
            ...result,
            // Store local date/time string for display
            localDateTime,
          } as BlockLookupResult & { localDateTime: string },
          progress: null,
        }));
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: errorMessage,
          result: null,
          progress: null,
        }));
      }
    },
    [
      convertLocalDateTimeToUnixTimestamp,
      convertUnixTimestampToLocalDateTime,
      getErrorMessage,
    ]
  );

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setState({
      status: "idle",
      error: null,
      result: null,
      progress: null,
      timezone: browserTimezone,
    });
  }, [browserTimezone]);

  return {
    ...state,
    lookupBlock,
    reset,
  };
}


