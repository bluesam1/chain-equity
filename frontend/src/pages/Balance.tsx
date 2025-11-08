import { useState } from "react";
import { ethers } from "ethers";
import {
  Card,
  Button,
  StatusIndicator,
  WalletAddressPopover,
} from "../components";
import { useBalance } from "../hooks/useBalance";
import { useWallet } from "../hooks/useWallet";
import { useTabNavigation } from "../contexts/TabNavigationContext";
import { addTokenToMetaMask } from "../lib/contract";

export const Balance: React.FC = () => {
  const { balance, symbol, contractInfo, totalSupply, isLoading, error, refetch } =
    useBalance();
  const { address } = useWallet();
  const { navigateToTransactionHistory } = useTabNavigation();
  const [isAddingToken, setIsAddingToken] = useState(false);
  const [addTokenError, setAddTokenError] = useState<string | null>(null);
  const [addTokenSuccess, setAddTokenSuccess] = useState(false);

  const handleAddToMetaMask = async () => {
    if (!window.ethereum) {
      setAddTokenError("MetaMask is not installed");
      return;
    }

    setIsAddingToken(true);
    setAddTokenError(null);
    setAddTokenSuccess(false);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await addTokenToMetaMask(provider);
      setAddTokenSuccess(true);
      // Clear success message after 3 seconds
      setTimeout(() => setAddTokenSuccess(false), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add token to MetaMask";
      setAddTokenError(errorMessage);
    } finally {
      setIsAddingToken(false);
    }
  };

  const handleViewMyTransactions = () => {
    if (address) {
      navigateToTransactionHistory(address);
    }
  };

  // Format number with commas for thousands
  const formatNumberWithCommas = (value: string | null): string => {
    if (!value) return "";
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    return num.toLocaleString("en-US", {
      maximumFractionDigits: 18,
      useGrouping: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <Card variant="elevated" className="text-center">
        <h2 className="text-lg font-semibold text-text-secondary mb-4">
          Token Balance
        </h2>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <StatusIndicator
              variant="pending"
              message="Loading balance..."
              display="inline"
            />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <StatusIndicator
              variant="error"
              message={error}
              display="inline"
              actionLink={{
                label: "Retry",
                onClick: refetch,
              }}
            />
          </div>
        )}
        {!isLoading && !error && balance !== null && (
          <div>
            <div className="text-5xl font-bold text-text-primary mb-2">
              {balance}
            </div>
            <div className="text-xl text-text-secondary">
              {symbol || "TOKENS"}
            </div>
          </div>
        )}
      </Card>

      {/* Account Information */}
      <Card variant="standard">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Account Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Wallet Address
            </label>
            <div className="mt-1">
              {address ? (
                <WalletAddressPopover
                  address={address}
                  trigger={
                    <span className="font-mono text-sm text-text-primary cursor-pointer">
                      {address}
                    </span>
                  }
                />
              ) : (
                <span className="font-mono text-sm text-text-primary">
                  Not connected
                </span>
              )}
            </div>
          </div>
          {contractInfo && (
            <>
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Token Name
                </label>
                <div className="mt-1 text-sm text-text-primary">
                  {contractInfo.name}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-text-secondary">
                  Token Symbol
                </label>
                <div className="mt-1 text-sm text-text-primary">
                  {contractInfo.symbol}
                </div>
              </div>
              {totalSupply && (
                <div>
                  <label className="text-sm font-medium text-text-secondary">
                    Total Supply
                  </label>
                  <div className="mt-1 text-sm text-text-primary">
                    {formatNumberWithCommas(totalSupply)} {contractInfo.symbol}
                  </div>
                </div>
              )}
            </>
          )}

          {/* View My Transactions */}
          {address && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-3">
                View all transactions involving your wallet address.
              </p>
              <Button
                variant="secondary"
                onClick={handleViewMyTransactions}
                className="w-full"
              >
                View My Transactions
              </Button>
            </div>
          )}

          {/* Add Token to MetaMask */}
          {contractInfo && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-text-secondary mb-3">
                Add this token to your MetaMask wallet to see it in your token
                list.
              </p>
              <Button
                variant="primary"
                onClick={handleAddToMetaMask}
                disabled={isAddingToken}
                isLoading={isAddingToken}
                className="w-full"
              >
                {isAddingToken
                  ? "Adding to MetaMask..."
                  : "Add Token to MetaMask"}
              </Button>

              {addTokenError && (
                <div className="mt-3">
                  <StatusIndicator
                    variant="error"
                    message={addTokenError}
                    display="inline"
                  />
                </div>
              )}

              {addTokenSuccess && (
                <div className="mt-3">
                  <StatusIndicator
                    variant="success"
                    message="Token added to MetaMask successfully! Check your wallet."
                    display="inline"
                    autoDismiss={true}
                    dismissDelay={3000}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
