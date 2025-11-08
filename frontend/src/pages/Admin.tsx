import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Card, Button, Input, Modal, StatusIndicator } from "../components";
import { useApproveWallet } from "../hooks/useApproveWallet";
import { useMintTokens } from "../hooks/useMintTokens";
import { useExecuteSplit } from "../hooks/useExecuteSplit";
import { useChangeSymbol } from "../hooks/useChangeSymbol";
import { useBalance } from "../hooks/useBalance";

export const Admin: React.FC = () => {
  const {
    status,
    error,
    txHash,
    isApproved,
    checkApprovalStatus,
    executeApprove,
    executeRevoke,
    reset,
  } = useApproveWallet();
  const [walletAddress, setWalletAddress] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isRevoke, setIsRevoke] = useState(false);
  const [approveTouched, setApproveTouched] = useState(false);

  const {
    recipient,
    amount,
    status: mintStatus,
    error: mintError,
    txHash: mintTxHash,
    validation: mintValidation,
    setRecipient,
    setAmount,
    isMintValid,
    executeMint,
    reset: resetMint,
  } = useMintTokens();
  const [showMintConfirmDialog, setShowMintConfirmDialog] = useState(false);
  const [mintTouched, setMintTouched] = useState(false);

  const {
    multiplier,
    status: splitStatus,
    error: splitError,
    txHash: splitTxHash,
    beforeBalance,
    afterBalance,
    beforeTotalSupply,
    afterTotalSupply,
    calculateBalances,
    execute: executeSplit,
    setMultiplier,
    validateMultiplier,
    reset: resetSplit,
  } = useExecuteSplit();
  const { refetch: refetchBalance } = useBalance();
  const [showSplitWarningDialog, setShowSplitWarningDialog] = useState(false);

  const {
    newSymbol,
    currentSymbol,
    status: symbolStatus,
    error: symbolError,
    txHash: symbolTxHash,
    validateSymbol,
    getCurrentSymbol,
    isSymbolValid,
    setNewSymbol,
    execute: executeChangeSymbol,
    reset: resetSymbol,
  } = useChangeSymbol();
  const [showSymbolConfirmDialog, setShowSymbolConfirmDialog] = useState(false);
  const [symbolTouched, setSymbolTouched] = useState(false);

  // Calculate balances on mount and when multiplier changes
  useEffect(() => {
    calculateBalances();
  }, [calculateBalances, multiplier]);

  // Get current symbol on mount
  useEffect(() => {
    getCurrentSymbol();
  }, [getCurrentSymbol]);

  // Check approval status when address changes
  useEffect(() => {
    if (walletAddress) {
      checkApprovalStatus(walletAddress);
    }
  }, [walletAddress, checkApprovalStatus]);

  const handleApprove = () => {
    setApproveTouched(true); // Mark form as touched when submit is attempted
    if (!walletAddress || !ethers.isAddress(walletAddress)) return;
    setIsRevoke(false);
    setShowConfirmDialog(true);
  };

  const handleRevoke = () => {
    setApproveTouched(true); // Mark form as touched when submit is attempted
    if (!walletAddress || !ethers.isAddress(walletAddress)) return;
    setIsRevoke(true);
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return;
    }

    try {
      if (isRevoke) {
        await executeRevoke(walletAddress);
      } else {
        await executeApprove(walletAddress);
      }
      // Close dialog and reset form after successful transaction
      setShowConfirmDialog(false);
      setTimeout(() => {
        reset();
        setWalletAddress("");
        setApproveTouched(false);
      }, 2000);
    } catch (error) {
      // Error already handled in useApproveWallet hook
      // Keep dialog open so user can see the error
      console.error("Approve/Revoke error:", error);
    }
  };

  const isValidAddress = walletAddress && ethers.isAddress(walletAddress);

  const handleMint = () => {
    setMintTouched(true); // Mark form as touched when submit is attempted
    if (!isMintValid()) return;
    setShowMintConfirmDialog(true);
  };

  const handleMintConfirm = async () => {
    try {
      await executeMint();
      // Close dialog and reset form after successful transaction
      setShowMintConfirmDialog(false);
      setTimeout(() => {
        resetMint();
        setMintTouched(false);
      }, 2000);
    } catch (error) {
      // Error already handled in useMintTokens
      // Keep dialog open so user can see the error
      // Dialog will show error state via mintStatus and mintError
      console.error("Mint transaction error:", error);
    }
  };

  const getMintRecipientError = (): string | null => {
    if (!recipient) return null;
    if (mintValidation.recipientValid === false) {
      return "Invalid address format";
    }
    if (
      mintValidation.recipientValid === true &&
      mintValidation.recipientOnAllowlist === false
    ) {
      return "Recipient not on allowlist";
    }
    return null;
  };

  const getMintAmountError = (): string | null => {
    if (!amount) return null;
    if (mintValidation.amountValid === false) {
      return "Invalid amount";
    }
    return null;
  };

  const handleExecuteSplit = () => {
    setShowSplitWarningDialog(true);
  };

  const handleSplitConfirm = async () => {
    setShowSplitWarningDialog(false);
    try {
      await executeSplit();
      // Refresh balance after successful split
      setTimeout(() => {
        refetchBalance();
        resetSplit();
      }, 2000);
    } catch (error) {
      // Error already handled in useExecuteSplit
    }
  };

  const handleChangeSymbol = () => {
    setSymbolTouched(true); // Mark form as touched when submit is attempted
    if (!isSymbolValid()) return;
    setShowSymbolConfirmDialog(true);
  };

  const handleSymbolConfirm = async () => {
    setShowSymbolConfirmDialog(false);
    try {
      await executeChangeSymbol();
      // Refresh symbol display after successful change
      setTimeout(() => {
        getCurrentSymbol();
        resetSymbol();
        setSymbolTouched(false);
      }, 2000);
    } catch (error) {
      // Error already handled in useChangeSymbol
    }
  };

  const getSymbolError = (): string | null => {
    if (!newSymbol) return null;
    if (!validateSymbol(newSymbol)) {
      return "Symbol must be 1-10 uppercase alphanumeric characters";
    }
    if (newSymbol === currentSymbol) {
      return "Symbol unchanged";
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Approve Wallet Section */}
      <div id="approve-wallet">
        <Card variant="standard">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Approve Wallet
          </h2>

          <div className="space-y-4">
            {/* Address Input */}
            <Input
              variant="address"
              label="Wallet Address"
              placeholder="0x..."
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              isValid={
                isValidAddress && isApproved === false
                  ? true
                  : isValidAddress && isApproved === true
                  ? false
                  : undefined
              }
              errorMessage={
                walletAddress && !ethers.isAddress(walletAddress)
                  ? "Invalid address format"
                  : isApproved === true
                  ? "Address is already approved"
                  : undefined
              }
              showValidationIndicator={true}
              touched={approveTouched}
              disabled={status === "pending"}
            />

            {/* Approval Status */}
            {isValidAddress && (
              <div className="p-3 bg-surface border border-border rounded-lg">
                <p className="text-sm text-text-secondary">
                  Status:{" "}
                  {isApproved === true
                    ? "Approved"
                    : isApproved === false
                    ? "Not Approved"
                    : "Checking..."}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={handleApprove}
                disabled={
                  !isValidAddress || isApproved === true || status === "pending"
                }
                isLoading={status === "pending" && !isRevoke}
                className="flex-1"
              >
                {status === "pending" && !isRevoke ? "Approving..." : "Approve"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleRevoke}
                disabled={
                  !isValidAddress ||
                  isApproved === false ||
                  status === "pending"
                }
                isLoading={status === "pending" && isRevoke}
                className="flex-1"
              >
                {status === "pending" && isRevoke ? "Revoking..." : "Revoke"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Transaction Status */}
      {status === "success" && (
        <StatusIndicator
          variant="success"
          message={`Wallet ${isRevoke ? "revoked" : "approved"} successfully!`}
          display="inline"
          autoDismiss={true}
          dismissDelay={5000}
          actionLink={
            txHash
              ? {
                  label: "View Transaction",
                  href: `#`, // TODO: Add block explorer link
                  onClick: () => console.log("View transaction:", txHash),
                }
              : undefined
          }
        />
      )}

      {status === "error" && error && (
        <StatusIndicator
          variant="error"
          message={error}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: () => reset(),
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        variant={isRevoke ? "warning" : "confirmation"}
        title={isRevoke ? "Confirm Revoke Wallet" : "Confirm Approve Wallet"}
        preventClose={status === "pending"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Wallet Address
            </label>
            <p className="text-text-primary font-mono text-sm mt-1">
              {walletAddress}
            </p>
          </div>
          <p className="text-text-secondary text-sm">
            {isRevoke
              ? "This will remove the wallet from the allowlist. The wallet will no longer be able to transfer tokens."
              : "This will add the wallet to the allowlist. The wallet will be able to transfer tokens."}
          </p>

          {error && (
            <div className="p-3 bg-error/10 border border-error rounded-lg">
              <p className="text-error text-sm">{error}</p>
            </div>
          )}

          {status === "success" && (
            <div className="p-3 bg-success/10 border border-success rounded-lg">
              <p className="text-success text-sm">
                {isRevoke
                  ? "Wallet revoked successfully!"
                  : "Wallet approved successfully!"}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmDialog(false)}
              disabled={status === "pending"}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant={isRevoke ? "destructive" : "primary"}
              onClick={handleConfirm}
              disabled={status === "pending"}
              isLoading={status === "pending"}
              className="flex-1"
            >
              {isRevoke ? "Revoke" : "Confirm"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mint Tokens Section */}
      <div id="mint-tokens">
        <Card variant="standard">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Mint Tokens
          </h2>

          <div className="space-y-4">
            {/* Recipient Address Input */}
            <Input
              variant="address"
              label="Recipient Address"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              isValid={
                mintValidation.recipientValid === true &&
                mintValidation.recipientOnAllowlist === true
              }
              errorMessage={getMintRecipientError() || undefined}
              showValidationIndicator={true}
              touched={mintTouched}
              disabled={mintStatus === "pending"}
            />

            {/* Link to Approve Wallet if recipient not approved */}
            {mintValidation.recipientValid === true &&
              mintValidation.recipientOnAllowlist === false && (
                <div className="p-3 bg-warning/10 border border-warning rounded-lg">
                  <p className="text-sm text-warning mb-2">
                    Recipient must be approved before minting tokens.
                  </p>
                  <button
                    onClick={() => {
                      setWalletAddress(recipient);
                      document
                        .getElementById("approve-wallet")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="text-sm text-primary hover:underline"
                  >
                    Approve Wallet →
                  </button>
                </div>
              )}

            {/* Amount Input */}
            <Input
              variant="number"
              label="Amount"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              isValid={mintValidation.amountValid === true}
              errorMessage={getMintAmountError() || undefined}
              showValidationIndicator={true}
              touched={mintTouched}
              disabled={mintStatus === "pending"}
            />

            {/* Mint Button */}
            <Button
              variant="primary"
              onClick={handleMint}
              disabled={!isMintValid() || mintStatus === "pending"}
              isLoading={mintStatus === "pending"}
              className="w-full"
            >
              {mintStatus === "pending" ? "Minting..." : "Mint Tokens"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Mint Transaction Status */}
      {mintStatus === "success" && (
        <StatusIndicator
          variant="success"
          message="Tokens minted successfully!"
          display="inline"
          autoDismiss={true}
          dismissDelay={5000}
          actionLink={
            mintTxHash
              ? {
                  label: "View Transaction",
                  href: `#`, // TODO: Add block explorer link
                  onClick: () => console.log("View transaction:", mintTxHash),
                }
              : undefined
          }
        />
      )}

      {mintStatus === "error" && mintError && (
        <StatusIndicator
          variant="error"
          message={mintError}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: () => resetMint(),
          }}
        />
      )}

      {/* Mint Confirmation Dialog */}
      <Modal
        isOpen={showMintConfirmDialog}
        onClose={() => {
          if (mintStatus !== "pending") {
            setShowMintConfirmDialog(false);
            if (mintStatus === "error") {
              resetMint();
            }
          }
        }}
        variant="confirmation"
        title="Confirm Mint Tokens"
        preventClose={mintStatus === "pending"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Recipient
            </label>
            <p className="text-text-primary font-mono text-sm mt-1">
              {recipient}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Amount
            </label>
            <p className="text-text-primary text-lg font-semibold mt-1">
              {amount}
            </p>
          </div>
          <p className="text-text-secondary text-sm">
            This will mint tokens to the recipient address. The recipient must
            be on the allowlist.
          </p>

          {/* Error Display */}
          {mintStatus === "error" && mintError && (
            <div className="p-3 bg-error/10 border border-error rounded-lg">
              <p className="text-sm text-error font-medium">Error</p>
              <p className="text-sm text-error mt-1">{mintError}</p>
            </div>
          )}

          {/* Success Display */}
          {mintStatus === "success" && (
            <div className="p-3 bg-success/10 border border-success rounded-lg">
              <p className="text-sm text-success font-medium">Success!</p>
              <p className="text-sm text-success mt-1">
                Tokens minted successfully!
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMintConfirmDialog(false);
                if (mintStatus === "error") {
                  resetMint();
                }
              }}
              disabled={mintStatus === "pending"}
              className="flex-1"
            >
              {mintStatus === "success" ? "Close" : "Cancel"}
            </Button>
            {mintStatus !== "success" && (
              <Button
                variant="primary"
                onClick={handleMintConfirm}
                disabled={mintStatus === "pending"}
                isLoading={mintStatus === "pending"}
                className="flex-1"
              >
                {mintStatus === "pending" ? "Minting..." : "Confirm"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Execute Split Section */}
      <div id="execute-split">
        <Card variant="standard">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Corporate Actions
          </h2>
          <h3 className="text-md font-semibold text-text-secondary mb-4">
            Execute Stock Split
          </h3>

          <div className="space-y-4">
            {/* Multiplier Input */}
            <Input
              variant="number"
              label="Split Multiplier"
              placeholder="7"
              value={multiplier > 0 ? multiplier.toString() : ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  // Allow empty - user can clear the field
                  setMultiplier(0);
                  return;
                }
                const numValue = parseInt(value, 10);
                if (!isNaN(numValue)) {
                  setMultiplier(numValue);
                }
              }}
              isValid={validateMultiplier(multiplier)}
              errorMessage={
                !validateMultiplier(multiplier) && multiplier !== 0
                  ? "Multiplier must be a positive integer"
                  : undefined
              }
              showValidationIndicator={true}
              touched={false}
              disabled={splitStatus === "pending"}
            />

            {/* Split Details */}
            {multiplier > 0 && (
              <div className="p-4 bg-surface border border-border rounded-lg">
                <p className="text-sm text-text-secondary mb-2">Split Ratio</p>
                <p className="text-lg font-semibold text-text-primary">
                  {multiplier}-for-1
                </p>
                <p className="text-sm text-text-muted mt-2">
                  All token balances will be multiplied by {multiplier}. This
                  action cannot be undone.
                </p>
              </div>
            )}

            {/* Before/After Balance Comparison */}
            {beforeBalance && afterBalance && (
              <div className="p-4 bg-surface border border-border rounded-lg">
                <p className="text-sm font-semibold text-text-secondary mb-3">
                  Balance Impact
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Your Balance (Before)
                    </span>
                    <span className="text-sm font-mono text-text-primary">
                      {beforeBalance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-secondary">
                      Your Balance (After)
                    </span>
                    <span className="text-sm font-mono text-text-primary font-semibold">
                      {afterBalance}
                    </span>
                  </div>
                  {beforeTotalSupply && afterTotalSupply && (
                    <>
                      <div className="border-t border-border my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Total Supply (Before)
                        </span>
                        <span className="text-sm font-mono text-text-primary">
                          {beforeTotalSupply}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-text-secondary">
                          Total Supply (After)
                        </span>
                        <span className="text-sm font-mono text-text-primary font-semibold">
                          {afterTotalSupply}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Execute Split Button */}
            <Button
              variant="destructive"
              onClick={handleExecuteSplit}
              disabled={
                !validateMultiplier(multiplier) || splitStatus === "pending"
              }
              isLoading={splitStatus === "pending"}
              className="w-full"
            >
              {splitStatus === "pending"
                ? "Executing Split..."
                : multiplier > 0
                ? `Execute ${multiplier}-for-1 Split`
                : "Execute Split"}
            </Button>
          </div>
        </Card>
      </div>

      {/* Split Transaction Status */}
      {splitStatus === "success" && (
        <StatusIndicator
          variant="success"
          message={`Stock split executed successfully! All balances have been multiplied by ${multiplier}.`}
          display="inline"
          autoDismiss={true}
          dismissDelay={5000}
          actionLink={
            splitTxHash
              ? {
                  label: "View Transaction",
                  href: `#`, // TODO: Add block explorer link
                  onClick: () => console.log("View transaction:", splitTxHash),
                }
              : undefined
          }
        />
      )}

      {splitStatus === "error" && splitError && (
        <StatusIndicator
          variant="error"
          message={splitError}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: () => resetSplit(),
          }}
        />
      )}

      {/* Split Warning Dialog */}
      <Modal
        isOpen={showSplitWarningDialog}
        onClose={() => setShowSplitWarningDialog(false)}
        variant="warning"
        title="Warning: Execute Stock Split"
        preventClose={splitStatus === "pending"}
      >
        <div className="space-y-4">
          <div className="p-4 bg-warning/10 border border-warning rounded-lg">
            <p className="text-warning font-semibold mb-2">
              ⚠️ Destructive Action
            </p>
            <p className="text-text-secondary text-sm">
              {multiplier > 0 ? (
                <>
                  This will execute a {multiplier}-for-1 stock split,
                  multiplying all token balances by {multiplier}. This action
                  cannot be undone.
                </>
              ) : (
                <>
                  This will execute a stock split. This action cannot be undone.
                </>
              )}
            </p>
          </div>

          {multiplier > 0 && (
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Split Ratio
              </label>
              <p className="text-text-primary text-lg font-semibold mt-1">
                {multiplier}-for-1
              </p>
            </div>
          )}

          {beforeBalance && afterBalance && (
            <div>
              <label className="text-sm font-medium text-text-secondary">
                Balance Impact
              </label>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Before:</span>
                  <span className="text-text-primary font-mono">
                    {beforeBalance}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">After:</span>
                  <span className="text-text-primary font-mono font-semibold">
                    {afterBalance}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-text-secondary text-sm">
            Are you sure you want to execute this stock split? This action is
            irreversible.
          </p>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowSplitWarningDialog(false)}
              disabled={splitStatus === "pending"}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSplitConfirm}
              disabled={splitStatus === "pending"}
              isLoading={splitStatus === "pending"}
              className="flex-1"
            >
              Execute Split
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Symbol Section */}
      <div id="change-symbol">
        <Card variant="standard">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Change Token Symbol
          </h2>

          <div className="space-y-4">
            {/* Current Symbol Display */}
            {currentSymbol && (
              <div className="p-3 bg-surface border border-border rounded-lg">
                <p className="text-sm text-text-secondary">Current Symbol</p>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  {currentSymbol}
                </p>
              </div>
            )}

            {/* Symbol Input */}
            <Input
              variant="standard"
              label="New Symbol"
              placeholder="CET"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
              isValid={isSymbolValid()}
              errorMessage={getSymbolError() || undefined}
              showValidationIndicator={true}
              touched={symbolTouched}
              disabled={symbolStatus === "pending"}
              maxLength={10}
            />

            {/* Change Symbol Button */}
            <Button
              variant="primary"
              onClick={handleChangeSymbol}
              disabled={!isSymbolValid() || symbolStatus === "pending"}
              isLoading={symbolStatus === "pending"}
              className="w-full"
            >
              {symbolStatus === "pending"
                ? "Updating Symbol..."
                : "Update Symbol"}
            </Button>

            {/* MetaMask Note */}
            <div className="p-3 bg-primary/10 border border-primary rounded-lg">
              <p className="text-sm text-primary font-medium mb-1">
                ℹ️ MetaMask Note
              </p>
              <p className="text-sm text-text-secondary">
                After changing the symbol, users will need to re-add the token
                to MetaMask to see the updated symbol. Use the "Add Token to
                MetaMask" button on the Balance tab to update the token
                information.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Change Symbol Transaction Status */}
      {symbolStatus === "success" && (
        <StatusIndicator
          variant="success"
          message="Token symbol updated successfully!"
          display="inline"
          autoDismiss={true}
          dismissDelay={5000}
          actionLink={
            symbolTxHash
              ? {
                  label: "View Transaction",
                  href: `#`, // TODO: Add block explorer link
                  onClick: () => console.log("View transaction:", symbolTxHash),
                }
              : undefined
          }
        />
      )}

      {symbolStatus === "error" && symbolError && (
        <StatusIndicator
          variant="error"
          message={symbolError}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: () => resetSymbol(),
          }}
        />
      )}

      {/* Change Symbol Confirmation Dialog */}
      <Modal
        isOpen={showSymbolConfirmDialog}
        onClose={() => setShowSymbolConfirmDialog(false)}
        variant="confirmation"
        title="Confirm Change Symbol"
        preventClose={symbolStatus === "pending"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text-secondary">
              Current Symbol
            </label>
            <p className="text-text-primary font-mono text-sm mt-1">
              {currentSymbol || "N/A"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary">
              New Symbol
            </label>
            <p className="text-text-primary text-lg font-semibold mt-1">
              {newSymbol}
            </p>
          </div>
          <p className="text-text-secondary text-sm">
            This will update the token symbol. The new symbol will be displayed
            throughout the application.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowSymbolConfirmDialog(false)}
              disabled={symbolStatus === "pending"}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSymbolConfirm}
              disabled={symbolStatus === "pending"}
              isLoading={symbolStatus === "pending"}
              className="flex-1"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
