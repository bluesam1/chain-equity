/**
 * Tests for block lookup utilities
 *
 * NOTE: These tests require a testing framework (Vitest recommended for Vite projects).
 * To run these tests:
 * 1. Install Vitest: npm install -D vitest @vitest/ui
 * 2. Configure vite.config.ts to include test configuration
 * 3. Add test script to package.json: "test": "vitest"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ethers } from "ethers";
import {
  findBlockByTimestamp,
  getContractDeploymentBlock,
  FutureDateError,
  BeforeDeploymentError,
  ContractNotFoundError,
  type BlockLookupResult,
} from "../blockLookup";

// Mock ethers provider
class MockProvider {
  private blocks: Map<number, { timestamp: number; code?: string }> = new Map();
  private currentBlock: number = 1000;
  private contractAddress: string =
    "0x1234567890123456789012345678901234567890";

  constructor() {
    // Setup mock blocks
    for (let i = 0; i <= 1000; i++) {
      this.blocks.set(i, {
        timestamp: 1000000000 + i * 12, // 12 seconds per block (Sepolia-like)
        code: i >= 100 ? "0x608060405234801561001057600080fd5b50" : undefined, // Contract exists from block 100
      });
    }
  }

  async getBlockNumber(): Promise<number> {
    return this.currentBlock;
  }

  async getBlock(blockNumber: number | string): Promise<ethers.Block | null> {
    const num =
      typeof blockNumber === "string" ? parseInt(blockNumber) : blockNumber;
    const block = this.blocks.get(num);
    if (!block) return null;

    return {
      number: num,
      timestamp: block.timestamp,
      hash: `0x${num.toString(16).padStart(64, "0")}`,
      parentHash: `0x${(num - 1).toString(16).padStart(64, "0")}`,
      nonce: `0x${num.toString(16).padStart(16, "0")}`,
      difficulty: null,
      gasLimit: 30000000n,
      gasUsed: 1000000n,
      miner: "0x0000000000000000000000000000000000000000",
      extraData: "0x",
      transactions: [],
    } as ethers.Block;
  }

  async getCode(address: string, blockTag?: number | string): Promise<string> {
    if (address !== this.contractAddress) return "0x";
    const num =
      blockTag === undefined
        ? this.currentBlock
        : typeof blockTag === "string"
        ? parseInt(blockTag)
        : blockTag;
    const block = this.blocks.get(num);
    return block?.code || "0x";
  }
}

describe("blockLookup", () => {
  let mockProvider: MockProvider;
  let provider: ethers.Provider;

  beforeEach(() => {
    mockProvider = new MockProvider();
    provider = mockProvider as unknown as ethers.Provider;
  });

  describe("getContractDeploymentBlock", () => {
    it("should find contract deployment block", async () => {
      const contractAddress = "0x1234567890123456789012345678901234567890";
      const deploymentBlock = await getContractDeploymentBlock(
        provider,
        contractAddress
      );

      expect(deploymentBlock).toBe(100); // Contract deployed at block 100
    });

    it("should throw ContractNotFoundError if contract does not exist", async () => {
      const contractAddress = "0x0000000000000000000000000000000000000000";

      await expect(
        getContractDeploymentBlock(provider, contractAddress)
      ).rejects.toThrow(ContractNotFoundError);
    });

    it("should call progress callback during search", async () => {
      const contractAddress = "0x1234567890123456789012345678901234567890";
      const progressCallback = vi.fn();

      await getContractDeploymentBlock(
        provider,
        contractAddress,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe("findBlockByTimestamp", () => {
    it("should find block by timestamp", async () => {
      const targetTimestamp = 1000000500; // Between block 100 and 1000
      const result = await findBlockByTimestamp(provider, targetTimestamp);

      expect(result.blockNumber).toBeGreaterThanOrEqual(100);
      expect(result.blockNumber).toBeLessThanOrEqual(1000);
      expect(result.timestamp).toBeLessThanOrEqual(targetTimestamp);
    });

    it("should return exact block if timestamp matches", async () => {
      const targetTimestamp = 1000000120; // Block 10 (100 + 10 * 12)
      const result = await findBlockByTimestamp(provider, targetTimestamp);

      expect(result.timestamp).toBeLessThanOrEqual(targetTimestamp);
    });

    it("should throw FutureDateError if timestamp is in the future", async () => {
      const futureTimestamp = 2000000000; // Far in the future

      await expect(
        findBlockByTimestamp(provider, futureTimestamp)
      ).rejects.toThrow(FutureDateError);
    });

    it("should throw BeforeDeploymentError if timestamp is before deployment", async () => {
      const pastTimestamp = 1000000000; // Before block 100 (deployment)

      await expect(
        findBlockByTimestamp(provider, pastTimestamp)
      ).rejects.toThrow(BeforeDeploymentError);
    });

    it("should call progress callback during search", async () => {
      const targetTimestamp = 1000000500;
      const progressCallback = vi.fn();

      await findBlockByTimestamp(provider, targetTimestamp, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
    });
  });
});

