/**
 * Issuer service for issuer operations
 * Handles allowlist management, minting, and corporate actions
 */

import { ethers } from 'ethers';
import type { ChainEquityToken } from '../../contracts/typechain-types/src/ChainEquityToken.js';
import { getProvider } from './utils/provider.js';
import { getChainEquityTokenContract } from './utils/contract.js';

/**
 * IssuerService class for managing token operations
 */
export class IssuerService {
  private contract: ChainEquityToken;
  private signer: ethers.Signer;

  /**
   * Create an IssuerService instance
   * @param contractAddress - The ChainEquityToken contract address
   * @param signer - The ethers signer instance (must have appropriate roles)
   * @param rpcUrl - Optional RPC URL for provider
   */
  constructor(
    contractAddress: string,
    signer?: ethers.Signer,
    rpcUrl?: string
  ) {
    if (!ethers.isAddress(contractAddress)) {
      throw new Error(`Invalid contract address: ${contractAddress}`);
    }


    // If signer is provided, use it; otherwise create a wallet from private key
    if (signer) {
      this.signer = signer;
    } else {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error(
          'PRIVATE_KEY environment variable is required when signer is not provided'
        );
      }
      const provider = getProvider(rpcUrl);
      this.signer = new ethers.Wallet(privateKey, provider);
    }

    // Create contract instance with signer
    this.contract = getChainEquityTokenContract(
      contractAddress,
      this.signer
    );
  }

  /**
   * Approve a wallet address (add to allowlist)
   * Requires APPROVER_ROLE
   * @param address - The wallet address to approve
   * @returns Transaction hash
   */
  async approveWallet(address: string): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    try {
      // Verify role before attempting transaction
      const APPROVER_ROLE = await this.contract.APPROVER_ROLE();
      const hasRole = await this.contract.hasRole(
        APPROVER_ROLE,
        await this.signer.getAddress()
      );
      if (!hasRole) {
        throw new Error(
          'Signer does not have APPROVER_ROLE required for allowlist operations'
        );
      }

      const tx = await this.contract.approveWallet(address);
      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to approve wallet: ${error.message}`);
      }
      throw new Error(`Failed to approve wallet: ${String(error)}`);
    }
  }

  /**
   * Revoke a wallet address (remove from allowlist)
   * Requires APPROVER_ROLE
   * @param address - The wallet address to revoke
   * @returns Transaction hash
   */
  async revokeWallet(address: string): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    try {
      // Verify role before attempting transaction
      const APPROVER_ROLE = await this.contract.APPROVER_ROLE();
      const hasRole = await this.contract.hasRole(
        APPROVER_ROLE,
        await this.signer.getAddress()
      );
      if (!hasRole) {
        throw new Error(
          'Signer does not have APPROVER_ROLE required for allowlist operations'
        );
      }

      const tx = await this.contract.revokeWallet(address);
      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to revoke wallet: ${error.message}`);
      }
      throw new Error(`Failed to revoke wallet: ${String(error)}`);
    }
  }

  /**
   * Check if a wallet address is allowlisted
   * @param address - The wallet address to check
   * @returns True if allowlisted, false otherwise
   */
  async isAllowlisted(address: string): Promise<boolean> {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    try {
      return await this.contract.allowlist(address);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to check allowlist status: ${error.message}`);
      }
      throw new Error(`Failed to check allowlist status: ${String(error)}`);
    }
  }

  /**
   * Mint tokens to an approved wallet
   * Requires MINTER_ROLE and recipient must be allowlisted
   * @param address - The recipient wallet address
   * @param amount - The amount of tokens to mint (as string or BigNumber)
   * @returns Transaction hash
   */
  async mintTokens(
    address: string,
    amount: string | bigint | ethers.BigNumberish
  ): Promise<string> {
    if (!ethers.isAddress(address)) {
      throw new Error(`Invalid wallet address: ${address}`);
    }

    const amountBN = ethers.parseUnits(
      typeof amount === 'string' ? amount : amount.toString(),
      18
    );
    if (amountBN <= 0n) {
      throw new Error('Amount must be greater than zero');
    }

    try {
      // Verify role before attempting transaction
      const MINTER_ROLE = await this.contract.MINTER_ROLE();
      const hasRole = await this.contract.hasRole(
        MINTER_ROLE,
        await this.signer.getAddress()
      );
      if (!hasRole) {
        throw new Error(
          'Signer does not have MINTER_ROLE required for minting'
        );
      }

      // Verify recipient is allowlisted
      const isAllowlisted = await this.contract.allowlist(address);
      if (!isAllowlisted) {
        throw new Error(
          `Recipient address ${address} is not allowlisted. Minting requires recipient to be on allowlist.`
        );
      }

      const tx = await this.contract.mint(address, amountBN);
      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to mint tokens: ${error.message}`);
      }
      throw new Error(`Failed to mint tokens: ${String(error)}`);
    }
  }

  /**
   * Execute a virtual split corporate action
   * Requires DEFAULT_ADMIN_ROLE
   * @param multiplier - The new multiplier value (must be greater than 0)
   * @returns Transaction hash
   */
  async executeSplit(multiplier: bigint | string | number): Promise<string> {
    const multiplierBN =
      typeof multiplier === 'bigint'
        ? multiplier
        : ethers.parseUnits(multiplier.toString(), 0);

    if (multiplierBN <= 0n) {
      throw new Error('Multiplier must be greater than zero');
    }

    try {
      // Verify role before attempting transaction
      const DEFAULT_ADMIN_ROLE = await this.contract.DEFAULT_ADMIN_ROLE();
      const hasRole = await this.contract.hasRole(
        DEFAULT_ADMIN_ROLE,
        await this.signer.getAddress()
      );
      if (!hasRole) {
        throw new Error(
          'Signer does not have DEFAULT_ADMIN_ROLE required for corporate actions'
        );
      }

      const tx = await this.contract.executeSplit(multiplierBN);
      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to execute split: ${error.message}`);
      }
      throw new Error(`Failed to execute split: ${String(error)}`);
    }
  }

  /**
   * Change the token symbol
   * Requires DEFAULT_ADMIN_ROLE
   * @param newSymbol - The new symbol string
   * @returns Transaction hash
   */
  async changeSymbol(newSymbol: string): Promise<string> {
    if (!newSymbol || newSymbol.trim().length === 0) {
      throw new Error('Symbol cannot be empty');
    }

    try {
      // Verify role before attempting transaction
      const DEFAULT_ADMIN_ROLE = await this.contract.DEFAULT_ADMIN_ROLE();
      const hasRole = await this.contract.hasRole(
        DEFAULT_ADMIN_ROLE,
        await this.signer.getAddress()
      );
      if (!hasRole) {
        throw new Error(
          'Signer does not have DEFAULT_ADMIN_ROLE required for corporate actions'
        );
      }

      const tx = await this.contract.changeSymbol(newSymbol);
      await tx.wait();
      return tx.hash;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to change symbol: ${error.message}`);
      }
      throw new Error(`Failed to change symbol: ${String(error)}`);
    }
  }
}
