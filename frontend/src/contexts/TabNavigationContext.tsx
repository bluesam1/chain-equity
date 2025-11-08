import React, { createContext, useContext, useState, ReactNode } from "react";

interface TabNavigationContextType {
  activeTabId: string;
  setActiveTabId: (tabId: string) => void;
  navigateToTransactionHistory: (address?: string) => void;
  transactionHistoryAddress: string | null;
  clearTransactionHistoryAddress: () => void;
}

const TabNavigationContext = createContext<
  TabNavigationContextType | undefined
>(undefined);

export const TabNavigationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>("balance");
  const [transactionHistoryAddress, setTransactionHistoryAddress] = useState<
    string | null
  >(null);

  const navigateToTransactionHistory = (address?: string) => {
    setActiveTabId("transaction-history");
    if (address) {
      setTransactionHistoryAddress(address);
    }
  };

  const clearTransactionHistoryAddress = () => {
    setTransactionHistoryAddress(null);
  };

  return (
    <TabNavigationContext.Provider
      value={{
        activeTabId,
        setActiveTabId,
        navigateToTransactionHistory,
        transactionHistoryAddress,
        clearTransactionHistoryAddress,
      }}
    >
      {children}
    </TabNavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error(
      "useTabNavigation must be used within TabNavigationProvider"
    );
  }
  return context;
};
