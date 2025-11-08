/**
 * Contract interaction utilities
 * Provides contract instance creation for ChainEquityToken
 */

import { ethers, type ContractRunner } from "ethers";

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown }) => Promise<unknown>;
      isMetaMask?: boolean;
    };
  }
}

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ERC-20 ABI (minimal for balance and symbol queries)
const ERC20_ABI = [
  "function balanceOf(address account) view returns (uint256)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function multiplier() view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function allowlist(address account) view returns (bool)",
  "function approveWallet(address account)",
  "function revokeWallet(address account)",
  "function mint(address to, uint256 amount)",
  "function executeSplit(uint256 newMultiplier)",
  "function changeSymbol(string memory newSymbol)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event AllowlistUpdated(address indexed account, bool approved)",
  "event SplitExecuted(uint256 newMultiplier, uint256 blockNumber)",
  "event SymbolChanged(string oldSymbol, string newSymbol)",
] as const;

export interface ContractInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Get contract address from environment
 */
export function getContractAddress(): string {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "Contract address not configured. Please set VITE_CONTRACT_ADDRESS in your .env file."
    );
  }
  return CONTRACT_ADDRESS;
}

/**
 * Create a contract instance
 */
export function getContract(provider: ContractRunner) {
  const address = getContractAddress();
  return new ethers.Contract(address, ERC20_ABI, provider);
}

/**
 * Get token balance for an address
 * @param address The address to query
 * @param provider The contract runner (provider or signer)
 * @param blockNumber Optional block number to query at (for historical queries)
 */
export async function getBalance(
  address: string,
  provider: ContractRunner,
  blockNumber?: number
): Promise<bigint> {
  const contract = getContract(provider);
  if (blockNumber !== undefined) {
    return await contract.balanceOf(address, { blockTag: blockNumber });
  }
  return await contract.balanceOf(address);
}

/**
 * Get token symbol
 */
export async function getSymbol(provider: ContractRunner): Promise<string> {
  const contract = getContract(provider);
  return await contract.symbol();
}

/**
 * Get token name
 */
export async function getName(provider: ContractRunner): Promise<string> {
  const contract = getContract(provider);
  return await contract.name();
}

/**
 * Get token decimals
 */
export async function getDecimals(provider: ContractRunner): Promise<number> {
  const contract = getContract(provider);
  return await contract.decimals();
}

/**
 * Get total supply
 * @param provider The contract runner (provider or signer)
 * @param blockNumber Optional block number to query at (for historical queries)
 */
export async function getTotalSupply(
  provider: ContractRunner,
  blockNumber?: number
): Promise<bigint> {
  const contract = getContract(provider);
  if (blockNumber !== undefined) {
    return await contract.totalSupply({ blockTag: blockNumber });
  }
  return await contract.totalSupply();
}

/**
 * Get current multiplier
 */
export async function getMultiplier(provider: ContractRunner): Promise<bigint> {
  const contract = getContract(provider);
  return await contract.multiplier();
}

/**
 * Get contract info (symbol, name, decimals)
 */
export async function getContractInfo(
  provider: ContractRunner
): Promise<ContractInfo> {
  const contract = getContract(provider);
  const [symbol, name, decimals] = await Promise.all([
    contract.symbol(),
    contract.name(),
    contract.decimals(),
  ]);

  return {
    address: getContractAddress(),
    symbol,
    name,
    decimals: Number(decimals),
  };
}

/**
 * Format token balance with decimals
 */
export function formatBalance(balance: bigint, decimals: number): string {
  return ethers.formatUnits(balance, decimals);
}

/**
 * Parse token amount from string to bigint
 */
export function parseAmount(amount: string, decimals: number): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Check if address is on allowlist
 */
export async function isOnAllowlist(
  address: string,
  provider: ContractRunner
): Promise<boolean> {
  const contract = getContract(provider);
  return await contract.allowlist(address);
}

/**
 * Transfer tokens
 */
export async function transferTokens(
  to: string,
  amount: bigint,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.transfer(to, amount);
}

/**
 * Approve wallet address (add to allowlist)
 */
export async function approveWallet(
  address: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.approveWallet(address);
}

/**
 * Revoke wallet address (remove from allowlist)
 */
export async function revokeWallet(
  address: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.revokeWallet(address);
}

/**
 * Mint tokens to an address
 */
export async function mintTokens(
  to: string,
  amount: bigint,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.mint(to, amount);
}

/**
 * Execute a stock split (multiplies all balances by the multiplier)
 */
export async function executeSplit(
  multiplier: bigint,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.executeSplit(multiplier);
}

/**
 * Change token symbol
 */
export async function changeSymbol(
  newSymbol: string,
  signer: ethers.Signer
): Promise<ethers.TransactionResponse> {
  const contract = getContract(signer);
  return await contract.changeSymbol(newSymbol);
}

/**
 * Add token to MetaMask wallet
 * Uses EIP-747 wallet_watchAsset standard
 */
export async function addTokenToMetaMask(
  provider: ContractRunner
): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  if (!window.ethereum.request) {
    throw new Error("MetaMask provider does not support wallet_watchAsset");
  }

  try {
    // Get token info
    const contractInfo = await getContractInfo(provider);

    // Request to add token to MetaMask
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: contractInfo.address,
          symbol: contractInfo.symbol,
          decimals: contractInfo.decimals,
        },
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("User rejected") ||
        error.message.includes("user rejected")
      ) {
        throw new Error("Token import cancelled by user");
      }
      throw error;
    }
    throw new Error("Failed to add token to MetaMask");
  }
}
