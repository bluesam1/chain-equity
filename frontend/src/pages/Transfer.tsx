import { useState, useEffect } from "react";
import { Card, Button, Input, Modal, StatusIndicator } from "../components";
import { useTransfer } from "../hooks/useTransfer";
import { useBalance } from "../hooks/useBalance";
import { useWallet } from "../hooks/useWallet";

export const Transfer: React.FC = () => {
  const { address } = useWallet();
  const { balance, refetch: refetchBalance } = useBalance();
  const {
    recipient,
    amount,
    status,
    error,
    txHash,
    validation,
    setRecipient,
    setAmount,
    validateSender,
    isTransferValid,
    executeTransfer,
    reset,
  } = useTransfer();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [touched, setTouched] = useState(false);

  // Validate sender on mount
  useEffect(() => {
    validateSender();
  }, [address, validateSender]);

  const handleTransfer = async () => {
    setTouched(true); // Mark form as touched when submit is attempted
    if (!isTransferValid()) return;
    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    try {
      await executeTransfer();
      // Reset form after successful transfer
      setTimeout(() => {
        reset();
        setTouched(false);
        refetchBalance();
      }, 2000);
    } catch (error) {
      // Error already handled in useTransfer
    }
  };

  const getRecipientError = (): string | null => {
    if (!recipient) return null;
    if (validation.recipientValid === false) {
      return "Invalid address format";
    }
    if (
      validation.recipientValid === true &&
      validation.recipientOnAllowlist === false
    ) {
      return "Recipient not on allowlist";
    }
    if (validation.senderOnAllowlist === false) {
      return "You are not on the allowlist";
    }
    return null;
  };

  const getAmountError = (): string | null => {
    if (!amount) return null;
    if (validation.amountValid === false) {
      return "Invalid amount";
    }
    if (validation.hasInsufficientBalance) {
      return "Insufficient balance";
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Transfer Form */}
      <Card variant="standard">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Transfer Tokens
        </h2>

        <div className="space-y-4">
          {/* Balance Display */}
          <div className="p-4 bg-surface border border-border rounded-lg">
            <label className="text-sm font-medium text-text-secondary">
              Available Balance
            </label>
            <div className="text-2xl font-bold text-text-primary mt-1">
              {balance || "0.00"}
            </div>
          </div>

          {/* Recipient Address Input */}
          <Input
            variant="address"
            label="Recipient Address"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            isValid={
              validation.recipientValid === true &&
              validation.recipientOnAllowlist === true
            }
            errorMessage={getRecipientError() || undefined}
            showValidationIndicator={true}
            touched={touched}
            disabled={status === "pending"}
          />

          {/* Amount Input */}
          <Input
            variant="number"
            label="Amount"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            isValid={
              validation.amountValid === true &&
              !validation.hasInsufficientBalance
            }
            errorMessage={getAmountError() || undefined}
            showValidationIndicator={true}
            touched={touched}
            disabled={status === "pending"}
          />

          {/* Transfer Button */}
          <Button
            variant="primary"
            onClick={handleTransfer}
            disabled={!isTransferValid() || status === "pending"}
            isLoading={status === "pending"}
            className="w-full"
          >
            {status === "pending" ? "Transferring..." : "Transfer"}
          </Button>
        </div>
      </Card>

      {/* Transaction Status */}
      {status === "success" && (
        <StatusIndicator
          variant="success"
          message="Transfer successful!"
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
        variant="confirmation"
        title="Confirm Transfer"
        preventClose={status === "pending"}
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
              variant="primary"
              onClick={handleConfirm}
              disabled={status === "pending"}
              isLoading={status === "pending"}
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
