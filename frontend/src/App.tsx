import { useEffect } from "react";
import { Landing } from "./pages/Landing";
import { Balance } from "./pages/Balance";
import { Transfer } from "./pages/Transfer";
import { TransactionHistory } from "./pages/TransactionHistory";
import { CapTable } from "./pages/CapTable";
import { Admin } from "./pages/Admin";
import { useWallet } from "./hooks/useWallet";
import { useAuth } from "./hooks/useAuth";
import { WalletBadge, Tabs, type Tab } from "./components";
import { StatusIndicator } from "./components";
import {
  TabNavigationProvider,
  useTabNavigation,
} from "./contexts/TabNavigationContext";

function AppContent() {
  const { state, address, chainId, disconnectWallet, switchToCorrectNetwork } =
    useWallet();
  const {
    isAuthenticated,
    isLoading: authLoading,
    isAdmin,
    authenticate,
    signOut,
    error: authError,
  } = useAuth();
  const { activeTabId, setActiveTabId } = useTabNavigation();

  // Trigger authentication when wallet is connected
  useEffect(() => {
    if (state === "connected" && address && !isAuthenticated && !authLoading) {
      authenticate().catch((error) => {
        console.error("Authentication failed:", error);
      });
    }
  }, [state, address, isAuthenticated, authLoading, authenticate]);

  // Show landing page if not connected
  if (state === "disconnected" || state === "error" || state === "locked") {
    return <Landing />;
  }

  // Show loading state while authenticating
  if (state === "connected" && !isAuthenticated && authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <StatusIndicator
          variant="pending"
          message="Authenticating..."
          display="inline"
        />
      </div>
    );
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      disconnectWallet();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Show dashboard when connected and authenticated
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-surface border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-text-primary">
            Chain Equity
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded">
                Admin
              </span>
            )}
            <WalletBadge
              state={state === "wrong-network" ? "wrong-network" : "connected"}
              address={address}
              networkName="Local Dev Network"
              chainId={chainId}
              rpcUrl="http://localhost:8545"
              onDisconnect={handleLogout}
              onSwitchNetwork={switchToCorrectNetwork}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {authError && (
          <StatusIndicator
            variant="error"
            message={authError}
            display="inline"
            className="mb-4"
          />
        )}

        {/* Tab Navigation */}
        <Tabs
          tabs={
            [
              {
                id: "balance",
                label: "Balance",
                content: <Balance />,
              },
              {
                id: "transfer",
                label: "Transfer",
                content: <Transfer />,
              },
              {
                id: "transaction-history",
                label: "Transaction History",
                content: <TransactionHistory />,
              },
              {
                id: "cap-table",
                label: "Cap Table",
                content: <CapTable />,
              },
              ...(isAdmin
                ? [
                    {
                      id: "admin",
                      label: "Admin",
                      content: <Admin />,
                    },
                  ]
                : []),
            ] as Tab[]
          }
          activeTabId={activeTabId}
          onTabChange={setActiveTabId}
          defaultTabId="balance"
        />

        {state === "wrong-network" && (
          <div className="mt-4 p-4 bg-error/10 border border-error rounded-lg">
            <p className="text-error">Please switch to Local Dev Network</p>
          </div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <TabNavigationProvider>
      <AppContent />
    </TabNavigationProvider>
  );
}

export default App;
