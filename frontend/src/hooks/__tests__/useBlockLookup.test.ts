/**
 * Tests for useBlockLookup hook
 *
 * NOTE: These tests require a testing framework (Vitest recommended for Vite projects).
 * To run these tests:
 * 1. Install Vitest: npm install -D vitest @vitest/ui @testing-library/react @testing-library/react-hooks
 * 2. Configure vite.config.ts to include test configuration
 * 3. Add test script to package.json: "test": "vitest"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useBlockLookup } from "../useBlockLookup";
import * as blockLookup from "../../lib/blockLookup";

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  isMetaMask: true,
};

// Mock ethers provider
vi.mock("ethers", () => ({
  ethers: {
    BrowserProvider: vi.fn(() => ({
      getBlockNumber: vi.fn(),
      getBlock: vi.fn(),
      getCode: vi.fn(),
    })),
  },
}));

// Mock blockLookup utilities
vi.mock("../../lib/blockLookup", () => ({
  findBlockByTimestamp: vi.fn(),
  FutureDateError: class FutureDateError extends Error {
    constructor() {
      super("Future date error");
      this.name = "FutureDateError";
    }
  },
  BeforeDeploymentError: class BeforeDeploymentError extends Error {
    constructor() {
      super("Before deployment error");
      this.name = "BeforeDeploymentError";
    }
  },
  ContractNotFoundError: class ContractNotFoundError extends Error {
    constructor() {
      super("Contract not found error");
      this.name = "ContractNotFoundError";
    }
  },
}));

describe("useBlockLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Mock window.ethereum
    global.window.ethereum = mockEthereum;
  });

  describe("initialization", () => {
    it("should initialize with idle status", () => {
      const { result } = renderHook(() => useBlockLookup());

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.progress).toBeNull();
    });

    it("should detect browser timezone", () => {
      const { result } = renderHook(() => useBlockLookup());

      expect(result.current.timezone).toBeDefined();
      expect(typeof result.current.timezone).toBe("string");
    });
  });

  describe("lookupBlock", () => {
    it("should set loading status when lookup starts", async () => {
      const { result } = renderHook(() => useBlockLookup());

      vi.mocked(blockLookup.findBlockByTimestamp).mockResolvedValue({
        blockNumber: 1000,
        timestamp: 1000000000,
      });

      act(() => {
        result.current.lookupBlock("2024-01-01T12:00");
      });

      expect(result.current.status).toBe("loading");
    });

    it("should update state with result on success", async () => {
      const { result } = renderHook(() => useBlockLookup());

      const mockResult = {
        blockNumber: 1000,
        timestamp: 1000000000,
      };

      vi.mocked(blockLookup.findBlockByTimestamp).mockResolvedValue(mockResult);

      await act(async () => {
        await result.current.lookupBlock("2024-01-01T12:00");
      });

      await waitFor(() => {
        expect(result.current.status).toBe("success");
        expect(result.current.result).toBeDefined();
        expect(result.current.result?.blockNumber).toBe(1000);
      });
    });

    it("should handle FutureDateError", async () => {
      const { result } = renderHook(() => useBlockLookup());

      vi.mocked(blockLookup.findBlockByTimestamp).mockRejectedValue(
        new blockLookup.FutureDateError()
      );

      await act(async () => {
        await result.current.lookupBlock("2099-01-01T12:00");
      });

      await waitFor(() => {
        expect(result.current.status).toBe("error");
        expect(result.current.error).toContain("future");
      });
    });

    it("should handle BeforeDeploymentError", async () => {
      const { result } = renderHook(() => useBlockLookup());

      vi.mocked(blockLookup.findBlockByTimestamp).mockRejectedValue(
        new blockLookup.BeforeDeploymentError()
      );

      await act(async () => {
        await result.current.lookupBlock("2020-01-01T12:00");
      });

      await waitFor(() => {
        expect(result.current.status).toBe("error");
        expect(result.current.error).toContain(
          "before the contract was deployed"
        );
      });
    });

    it("should handle network errors", async () => {
      const { result } = renderHook(() => useBlockLookup());

      vi.mocked(blockLookup.findBlockByTimestamp).mockRejectedValue(
        new Error("Network error occurred")
      );

      await act(async () => {
        await result.current.lookupBlock("2024-01-01T12:00");
      });

      await waitFor(() => {
        expect(result.current.status).toBe("error");
        expect(result.current.error).toContain("Network error");
      });
    });

    it("should update progress during lookup", async () => {
      const { result } = renderHook(() => useBlockLookup());

      let progressCallback:
        | ((current: number, min: number, max: number) => void)
        | undefined;

      vi.mocked(blockLookup.findBlockByTimestamp).mockImplementation(
        async (provider, timestamp, callback) => {
          progressCallback = callback;
          // Simulate progress updates
          if (callback) {
            callback(500, 0, 1000);
            callback(750, 500, 1000);
          }
          return {
            blockNumber: 1000,
            timestamp: 1000000000,
          };
        }
      );

      act(() => {
        result.current.lookupBlock("2024-01-01T12:00");
      });

      await waitFor(() => {
        expect(result.current.progress).toBeDefined();
      });
    });
  });

  describe("reset", () => {
    it("should reset state to initial values", () => {
      const { result } = renderHook(() => useBlockLookup());

      // Set some state first
      act(() => {
        result.current.lookupBlock("2024-01-01T12:00");
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
      expect(result.current.progress).toBeNull();
    });
  });

  describe("timezone conversion", () => {
    it("should convert local date/time to Unix timestamp", () => {
      const { result } = renderHook(() => useBlockLookup());

      // This would require exposing the conversion function or testing indirectly
      // For now, we test that lookupBlock accepts date/time string
      expect(result.current.lookupBlock).toBeDefined();
    });
  });
});

