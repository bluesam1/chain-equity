import React, { useState, useRef, useEffect } from "react";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useTabNavigation } from "../contexts/TabNavigationContext";

export interface WalletAddressPopoverProps {
  address: string;
  trigger?: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  showOnHover?: boolean;
  children?: React.ReactNode;
}

export const WalletAddressPopover: React.FC<WalletAddressPopoverProps> = ({
  address,
  trigger,
  position: preferredPosition = "top",
  showOnHover = true,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const popoverId = `popover-${address.slice(0, 8)}`;
  const triggerId = `trigger-${address.slice(0, 8)}`;

  // Fetch balance only when popover is visible (lazy loading)
  const {
    balance,
    symbol,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useWalletBalance(address, isVisible);
  const { navigateToTransactionHistory } = useTabNavigation();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleNavigateToTransactionHistory = () => {
    navigateToTransactionHistory(address);
  };

  const truncateAddress = (addr: string, start = 4, end = 4) => {
    if (!addr || addr.length <= start + end) return addr;
    return `${addr.slice(0, start)}...${addr.slice(-end)}`;
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 8; // 8px spacing between trigger and popover

    let top = 0;
    let left = 0;

    // Determine vertical position
    if (preferredPosition === "top" || preferredPosition === "bottom") {
      if (preferredPosition === "top") {
        // Try above first
        top = triggerRect.top - popoverRect.height - spacing;
        if (top < 0) {
          // Not enough space above, flip to below
          top = triggerRect.bottom + spacing;
        }
      } else {
        // Try below first
        top = triggerRect.bottom + spacing;
        if (top + popoverRect.height > viewportHeight) {
          // Not enough space below, flip to above
          top = triggerRect.top - popoverRect.height - spacing;
        }
      }

      // Center horizontally relative to trigger
      left = triggerRect.left + triggerRect.width / 2 - popoverRect.width / 2;

      // Adjust if popover goes off screen horizontally
      if (left < 0) {
        left = spacing;
      } else if (left + popoverRect.width > viewportWidth) {
        left = viewportWidth - popoverRect.width - spacing;
      }
    } else {
      // Horizontal positioning (left/right)
      if (preferredPosition === "left") {
        left = triggerRect.left - popoverRect.width - spacing;
        if (left < 0) {
          left = triggerRect.right + spacing;
        }
      } else {
        left = triggerRect.right + spacing;
        if (left + popoverRect.width > viewportWidth) {
          left = triggerRect.left - popoverRect.width - spacing;
        }
      }

      // Center vertically relative to trigger
      top = triggerRect.top + triggerRect.height / 2 - popoverRect.height / 2;

      // Adjust if popover goes off screen vertically
      if (top < 0) {
        top = spacing;
      } else if (top + popoverRect.height > viewportHeight) {
        top = viewportHeight - popoverRect.height - spacing;
      }
    }

    setPopoverPosition({ top, left });
  };

  const handleMouseEnter = () => {
    if (!showOnHover) return;

    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    if (!showOnHover) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      setPopoverPosition(null);
    }, 200);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsVisible(true);
    }
  };

  // Escape key to close and focus trap
  useEffect(() => {
    if (!isVisible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVisible(false);
        setPopoverPosition(null);
        triggerRef.current?.focus();
      }
    };

    // Focus trap - get all focusable elements in popover
    const getFocusableElements = (): HTMLElement[] => {
      if (!popoverRef.current) return [];
      return Array.from(
        popoverRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];
    };

    // Focus first focusable element when popover opens
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Tab key for focus trap
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleTab);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleTab);
    };
  }, [isVisible]);

  // Touch support - show on click for touch devices
  const handleClick = () => {
    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      setIsVisible(!isVisible);
    }
  };

  // Recalculate position when popover becomes visible
  useEffect(() => {
    if (isVisible) {
      // Small delay to ensure popover is rendered before calculating position
      setTimeout(() => {
        calculatePosition();
      }, 0);
    }
  }, [isVisible]);

  // Recalculate position on window resize
  useEffect(() => {
    if (isVisible) {
      const handleResize = () => {
        calculatePosition();
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isVisible]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const defaultTrigger = (
    <span className="font-mono text-sm text-text-primary cursor-pointer">
      {truncateAddress(address)}
    </span>
  );

  return (
    <div
      ref={triggerRef}
      id={triggerId}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-haspopup="true"
      aria-expanded={isVisible}
      aria-controls={popoverId}
    >
      {trigger || defaultTrigger}

      {/* Screen reader announcements */}
      <div
        className="absolute left-[-10000px] w-1 h-1 overflow-hidden"
        aria-live="polite"
        aria-atomic="true"
      >
        {isVisible && `Balance popover for address ${address}`}
        {balance && !balanceLoading && `Balance: ${balance} ${symbol || ""}`}
        {copied && "Address copied to clipboard"}
      </div>

      {isVisible && (
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          aria-label={`Balance popover for address ${address}`}
          aria-describedby={triggerId}
          className="fixed z-50 bg-surface border border-border rounded-lg shadow-xl max-w-sm p-4 transition-opacity duration-200 opacity-100 [@media(prefers-reduced-motion:reduce)]:transition-none"
          style={
            popoverPosition
              ? {
                  top: `${popoverPosition.top}px`,
                  left: `${popoverPosition.left}px`,
                }
              : { visibility: "hidden" }
          }
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {children || (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-text-secondary mb-1">
                  Wallet Address
                </div>
                <div className="font-mono text-sm text-text-primary">
                  {address}
                </div>
              </div>

              {/* Balance Section */}
              <div>
                <div className="text-xs text-text-secondary mb-1">Balance</div>
                <div aria-live="polite" aria-atomic="true">
                  {balanceLoading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-sm text-text-secondary">
                        Loading...
                      </span>
                    </div>
                  ) : balanceError ? (
                    <div className="space-y-2">
                      <div className="text-sm text-error" role="alert">
                        {balanceError}
                      </div>
                      <button
                        onClick={refetchBalance}
                        className="text-xs text-primary hover:text-primary/80 underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        aria-label="Retry loading balance"
                      >
                        Retry
                      </button>
                    </div>
                  ) : balance !== null ? (
                    <div className="text-lg font-semibold text-text-primary">
                      {balance} {symbol || ""}
                    </div>
                  ) : (
                    <div className="text-lg font-semibold text-text-primary">
                      0.00 {symbol || ""}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {/* Copy Address Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(address);
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-surface border border-border rounded text-sm text-text-primary hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background transition-all duration-200"
                  aria-label={
                    copied ? "Address copied to clipboard" : "Copy address"
                  }
                  aria-live="polite"
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4 text-success"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <span>Copy Address</span>
                    </>
                  )}
                </button>

                {/* View Transaction History Link */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateToTransactionHistory();
                  }}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded transition-colors"
                  aria-label={`View transaction history for address ${address}`}
                >
                  <span>View Transaction History</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
