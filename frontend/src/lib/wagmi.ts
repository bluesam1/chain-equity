import { createConfig, http } from "wagmi";
import { defineChain } from "viem";
import { metaMask } from "wagmi/connectors";
import {
  TARGET_CHAIN_ID,
  TARGET_RPC_URL,
  TARGET_NETWORK_NAME,
} from "./network";

// Hardhat local network configuration
const hardhatLocal = defineChain({
  id: TARGET_CHAIN_ID,
  name: TARGET_NETWORK_NAME,
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [TARGET_RPC_URL],
    },
  },
});

export const wagmiConfig = createConfig({
  chains: [hardhatLocal],
  connectors: [metaMask()],
  transports: {
    [hardhatLocal.id]: http(),
  },
});
