import React from "react";
import { AddressFilter } from "./AddressFilter";

export interface TransactionFiltersProps {
  address: string | null;
  onAddressChange: (address: string | null) => void;
}

/**
 * Transaction filters component
 */
export const TransactionFilters: React.FC<TransactionFiltersProps> = ({
  address,
  onAddressChange,
}) => {
  return (
    <div className="space-y-4">
      <AddressFilter
        value={address}
        onChange={onAddressChange}
        debounceMs={500}
      />
    </div>
  );
};

