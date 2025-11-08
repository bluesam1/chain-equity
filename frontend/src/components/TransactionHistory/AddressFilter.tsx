import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../Input";
import { Button } from "../Button";
import { isValidEthereumAddress } from "../../utils/addressUtils";
import { formatAddress } from "../../utils/transactionUtils";

export interface AddressFilterProps {
  value: string | null;
  onChange: (address: string | null) => void;
  debounceMs?: number;
}

/**
 * Address filter component with validation and debouncing
 */
export const AddressFilter: React.FC<AddressFilterProps> = ({
  value,
  onChange,
  debounceMs = 500,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Validate address format
  const validateAddress = useCallback((address: string): boolean => {
    if (!address) {
      setValidationError(null);
      return true; // Empty is valid (no filter)
    }

    if (!isValidEthereumAddress(address)) {
      setValidationError("Please enter a valid Ethereum address (0x...)");
      return false;
    }

    setValidationError(null);
    return true;
  }, []);

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.trim();
      setInputValue(newValue);

      // Clear existing timer
      setDebounceTimer((prevTimer) => {
        if (prevTimer) {
          clearTimeout(prevTimer);
        }
        return null;
      });

      // Validate immediately
      const isValid = validateAddress(newValue);

      // If empty, immediately clear the filter (no debounce)
      if (!newValue) {
        onChange(null);
        return;
      }

      // Debounce the onChange callback for non-empty values
      const timer = setTimeout(() => {
        if (isValid) {
          onChange(newValue || null);
        }
      }, debounceMs);

      setDebounceTimer(timer);
    },
    [debounceMs, onChange, validateAddress]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setInputValue("");
    setValidationError(null);

    // Clear any pending debounce timer
    setDebounceTimer((prevTimer) => {
      if (prevTimer) {
        clearTimeout(prevTimer);
      }
      return null;
    });

    // Immediately clear the filter (no debounce)
    onChange(null);
  }, [onChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Input
            type="text"
            label="Filter by Address"
            placeholder="0x..."
            value={inputValue}
            onChange={handleInputChange}
            error={validationError || undefined}
            className="font-mono"
          />
        </div>
        {value && (
          <Button variant="secondary" onClick={handleClear} className="mt-6">
            Clear
          </Button>
        )}
      </div>
      {value && !validationError && (
        <div className="text-xs text-text-secondary">
          Filtering by:{" "}
          <span className="font-mono text-text-primary">
            {formatAddress(value, true)}
          </span>
        </div>
      )}
    </div>
  );
};
