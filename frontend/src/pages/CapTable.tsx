import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Input,
  Button,
  StatusIndicator,
  Modal,
} from "../components";
import { useCapTable, type CapTableEntry } from "../hooks/useCapTable";
import { useBlockLookup } from "../hooks/useBlockLookup";
import { exportCapTable, type ExportFormat } from "../lib/capTableExport";

export const CapTable: React.FC = () => {
  const [blockNumber, setBlockNumber] = useState<number | undefined>(undefined);
  const {
    entries,
    isLoading,
    error,
    totalSupply,
    blockNumber: currentBlock,
    refetch,
  } = useCapTable(blockNumber);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Block lookup hook
  const {
    status: lookupStatus,
    error: lookupError,
    result: lookupResult,
    progress: lookupProgress,
    timezone,
    lookupBlock,
    reset: resetLookup,
  } = useBlockLookup();
  const [isDateTimeModalOpen, setIsDateTimeModalOpen] = useState(false);
  const [dateTimeValue, setDateTimeValue] = useState<string>("");
  const [requestedDateTime, setRequestedDateTime] = useState<string>("");

  const handleBlockNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setBlockNumber(undefined);
    } else {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        setBlockNumber(num);
      }
    }
  };

  const handleResetBlockNumber = () => {
    setBlockNumber(undefined);
    setDateTimeValue("");
    setRequestedDateTime("");
    resetLookup();
    setIsDateTimeModalOpen(false);
  };

  // Handle date/time input change (in modal)
  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateTimeValue(e.target.value);
  };

  // Format datetime-local value to readable format
  const formatDateTimeForDisplay = (dateTimeString: string): string => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Handle submit button click in modal
  const handleDateTimeSubmit = () => {
    if (dateTimeValue) {
      setRequestedDateTime(dateTimeValue);
      lookupBlock(dateTimeValue);
      // Don't close modal immediately - let user see the result
    }
  };

  // Handle Apply Block button click
  const handleApplyBlock = () => {
    if (lookupStatus === "success" && lookupResult) {
      setBlockNumber(lookupResult.blockNumber);
      setIsDateTimeModalOpen(false);
      setDateTimeValue("");
      setRequestedDateTime("");
      resetLookup();
    }
  };

  // Handle datepicker icon button click
  const handleDatePickerClick = () => {
    setIsDateTimeModalOpen(true);
    // Reset lookup state when opening modal
    resetLookup();
  };

  // Auto-dismiss success message
  useEffect(() => {
    if (exportSuccess) {
      const timer = setTimeout(() => {
        setExportSuccess(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccess]);

  const handleExport = async () => {
    if (entries.length === 0) {
      setExportError("No data to export");
      return;
    }

    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      exportCapTable(entries, exportFormat, {
        format: exportFormat,
        blockNumber: currentBlock || undefined,
        totalSupply: totalSupply || undefined,
      });
      setExportSuccess(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export cap table";
      setExportError(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  // Format address for display (truncate)
  const formatAddress = (address: string): string => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Copy address to clipboard
  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  // Table columns
  const columns = [
    {
      key: "address",
      label: "Address",
      render: (_value: unknown, row: CapTableEntry) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm text-text-primary">
            {formatAddress(row.address)}
          </span>
          <button
            onClick={() => copyAddress(row.address)}
            className="text-primary hover:text-primary/80 text-xs"
            title="Copy address"
          >
            📋
          </button>
        </div>
      ),
    },
    {
      key: "balance",
      label: "Balance",
      sortable: true,
      sortType: "number" as const,
      align: "right" as const,
      render: (_value: unknown, row: CapTableEntry) => (
        <span className="text-text-primary font-mono">{row.balance}</span>
      ),
    },
    {
      key: "percentage",
      label: "Ownership %",
      sortable: true,
      sortType: "number" as const,
      align: "right" as const,
      render: (_value: unknown, row: CapTableEntry) => (
        <span className="text-text-primary font-semibold">
          {row.percentage}%
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cap Table Header */}
      <Card variant="standard">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Cap Table</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                variant="number"
                label="Block Number (optional)"
                placeholder="Latest"
                value={blockNumber?.toString() || ""}
                onChange={handleBlockNumberChange}
                className="w-40"
              />
              <button
                type="button"
                onClick={handleDatePickerClick}
                className="mt-6 p-2 bg-surface border border-border rounded-lg text-text-primary hover:bg-slate-700 active:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                title="Lookup block by date/time"
                aria-label="Lookup block by date/time"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            {blockNumber && (
              <Button
                variant="secondary"
                onClick={handleResetBlockNumber}
                className="mt-6"
              >
                Reset
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={refetch}
              disabled={isLoading}
              className="mt-6"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Export Section */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            className="px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isExporting || isLoading || entries.length === 0}
          >
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting || isLoading || entries.length === 0}
            isLoading={isExporting}
            className="mt-0"
          >
            {isExporting ? "Exporting..." : "Export Cap Table"}
          </Button>
        </div>

        {totalSupply && (
          <div className="mb-4 p-3 bg-surface border border-border rounded-lg">
            <p className="text-sm text-text-secondary">
              Total Supply:{" "}
              <span className="font-semibold text-text-primary">
                {totalSupply}
              </span>
            </p>
            {currentBlock && (
              <p className="text-sm text-text-secondary mt-1">
                Block Number:{" "}
                <span className="font-semibold text-text-primary">
                  {currentBlock}
                </span>
              </p>
            )}
          </div>
        )}
      </Card>

      {/* Date/Time Lookup Modal */}
      <Modal
        isOpen={isDateTimeModalOpen}
        onClose={() => {
          setIsDateTimeModalOpen(false);
          setDateTimeValue("");
          setRequestedDateTime("");
          resetLookup();
        }}
        title="Lookup Block by Date/Time"
        variant="information"
      >
        <div className="space-y-4">
          <div>
            <Input
              type="datetime-local"
              label={
                <span className="flex items-center gap-2">
                  <span>Date/Time</span>
                  <span className="text-xs font-medium text-text-primary">
                    ({timezone})
                  </span>
                </span>
              }
              placeholder="Select date/time"
              value={dateTimeValue}
              onChange={handleDateTimeChange}
              disabled={lookupStatus === "loading"}
            />
            <p className="mt-2 text-xs text-text-muted leading-relaxed">
              Blocks are created at discrete intervals. The system will find the
              closest block at or before your selected time.
            </p>
          </div>

          {/* Progress Indicator in Modal */}
          {lookupStatus === "loading" && lookupProgress && (
            <div className="mb-4">
              <StatusIndicator
                variant="pending"
                message={`Searching blocks ${lookupProgress.minBlock}-${lookupProgress.maxBlock}...`}
                display="inline"
              />
            </div>
          )}

          {/* Error in Modal */}
          {lookupStatus === "error" && lookupError && (
            <div className="mb-4">
              <StatusIndicator
                variant="error"
                message={lookupError}
                display="inline"
              />
            </div>
          )}

          {/* Result in Modal */}
          {lookupStatus === "success" && lookupResult && (
            <div className="mb-4 p-4 bg-surface border border-border rounded-lg space-y-3">
              <div>
                <p className="text-sm font-semibold text-text-primary mb-2">
                  Found Block: #{lookupResult.blockNumber}
                </p>

                {/* Visual Comparison */}
                {requestedDateTime && lookupResult.localDateTime && (
                  <div className="space-y-2 pt-2 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        You requested:
                      </span>
                      <span className="font-mono text-text-primary">
                        {formatDateTimeForDisplay(requestedDateTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">
                        Found block at:
                      </span>
                      <span className="font-mono font-semibold text-text-primary">
                        {formatDateTimeForDisplay(lookupResult.localDateTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end text-xs text-text-muted mt-1">
                      Timezone: {timezone}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDateTimeModalOpen(false);
                setDateTimeValue("");
                setRequestedDateTime("");
                resetLookup();
              }}
            >
              Cancel
            </Button>
            {lookupStatus === "success" && lookupResult ? (
              <Button variant="primary" onClick={handleApplyBlock}>
                Apply Block
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleDateTimeSubmit}
                disabled={!dateTimeValue || lookupStatus === "loading"}
                isLoading={lookupStatus === "loading"}
              >
                {lookupStatus === "loading" ? "Searching..." : "Lookup Block"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <StatusIndicator
            variant="pending"
            message="Loading cap table..."
            display="inline"
          />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <StatusIndicator
          variant="error"
          message={error}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: refetch,
          }}
        />
      )}

      {/* Export Success */}
      {exportSuccess && (
        <StatusIndicator
          variant="success"
          message="Cap table exported successfully!"
          display="inline"
          autoDismiss={true}
          dismissDelay={5000}
        />
      )}

      {/* Export Error */}
      {exportError && (
        <StatusIndicator
          variant="error"
          message={exportError}
          display="inline"
          actionLink={{
            label: "Retry",
            onClick: () => {
              setExportError(null);
              handleExport();
            },
          }}
        />
      )}

      {/* Cap Table */}
      {!isLoading && !error && (
        <Card variant="standard">
          {entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">No token holders found</p>
            </div>
          ) : (
            <Table<CapTableEntry>
              columns={columns}
              data={entries}
              variant="sortable"
              defaultSortColumn="balance"
              defaultSortDirection="desc"
            />
          )}
        </Card>
      )}
    </div>
  );
};
