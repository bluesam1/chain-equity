import React, { useState } from "react";
import { WalletAddressPopover } from "./WalletAddressPopover";

export type WalletState = "disconnected" | "connected" | "wrong-network";

export interface WalletBadgeProps {
  state: WalletState;
  address?: string;
  networkName?: string;
  chainId?: number;
  rpcUrl?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSwitchNetwork?: () => void;
  className?: string;
}

export const WalletBadge: React.FC<WalletBadgeProps> = ({
  state,
  address,
  networkName = "Local Dev Network",
  chainId,
  rpcUrl,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  className = "",
}) => {
  const [showFullAddress, setShowFullAddress] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncateAddress = (addr: string, start = 4, end = 4) => {
    if (!addr || addr.length <= start + end) return addr;
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getNetworkIndicatorColor = () => {
    if (state === "wrong-network") return "text-error";
    if (state === "connected") return "text-success";
    return "text-text-muted";
  };

  const getNetworkIndicatorBg = () => {
    if (state === "wrong-network") return "bg-error/10 border-error";
    if (state === "connected") return "bg-success/10 border-success";
    return "bg-surface border-border";
  };

  if (state === "disconnected") {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <button
          onClick={onConnect}
          className="px-4 py-2 bg-primary text-white rounded font-medium hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 min-h-[44px]"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Network Indicator */}
      {(state === "connected" || state === "wrong-network") && (
        <div
          className={`
            px-3 py-1.5 rounded border text-sm font-medium
            ${getNetworkIndicatorBg()} ${getNetworkIndicatorColor()}
            flex items-center gap-2
          `}
          title={
            chainId && rpcUrl
              ? `Chain ID: ${chainId}, RPC: ${rpcUrl}`
              : undefined
          }
        >
          <div
            className={`w-2 h-2 rounded-full ${
              state === "wrong-network" ? "bg-error" : "bg-success"
            }`}
          />
          <span>{networkName}</span>
        </div>
      )}

      {/* Wallet Address */}
      {address && (
        <WalletAddressPopover
          address={address}
          trigger={
            <button
              onClick={() => setShowFullAddress(!showFullAddress)}
              onMouseEnter={() => setShowFullAddress(true)}
              onMouseLeave={() => setShowFullAddress(false)}
              className="px-3 py-2 bg-surface border border-border rounded font-mono text-sm text-text-primary hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 min-h-[44px]"
              title={address}
            >
              {showFullAddress ? address : truncateAddress(address)}
            </button>
          }
        />
      )}

      {/* Wrong Network - Switch Button */}
      {state === "wrong-network" && onSwitchNetwork && (
        <button
          onClick={onSwitchNetwork}
          className="px-3 py-2 bg-warning text-white rounded font-medium hover:bg-amber-600 active:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 min-h-[44px]"
        >
          Switch Network
        </button>
      )}

      {/* Disconnect Button */}
      {state === "connected" && onDisconnect && (
        <button
          onClick={onDisconnect}
          className="px-3 py-2 bg-surface border border-border text-text-secondary rounded font-medium hover:bg-slate-700 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 min-h-[44px]"
        >
          Disconnect
        </button>
      )}
    </div>
  );
};
