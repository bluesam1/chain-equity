import React from "react";
import { Button, Card } from "../components";
import { useWallet } from "../hooks/useWallet";

export const Landing: React.FC = () => {
  const { connectWallet, isConnecting, error, isMetaMaskInstalled } =
    useWallet();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="elevated" className="text-center">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            Chain Equity
          </h1>
          <p className="text-text-secondary mb-8">
            Connect your wallet to access the tokenized equity platform
          </p>

          {!isMetaMaskInstalled && (
            <div className="mb-6 p-4 bg-warning/10 border border-warning rounded-lg">
              <p className="text-warning text-sm font-medium mb-2">
                MetaMask is not installed
              </p>
              <p className="text-text-secondary text-sm mb-4">
                Please install MetaMask to connect your wallet.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline text-sm"
              >
                Install MetaMask →
              </a>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-error/10 border border-error rounded-lg">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          <Button
            variant="primary"
            onClick={connectWallet}
            disabled={!isMetaMaskInstalled || isConnecting}
            isLoading={isConnecting}
            className="w-full"
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </Button>

          <p className="mt-6 text-text-muted text-sm">
            By connecting, you agree to the terms of service
          </p>
        </Card>
      </div>
    </div>
  );
};
