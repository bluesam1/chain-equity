import React, { useEffect, useState } from "react";

export type StatusVariant = "pending" | "success" | "error" | "info";
export type StatusDisplay = "inline" | "toast" | "banner";

export interface StatusIndicatorProps {
  variant: StatusVariant;
  message: string;
  display?: StatusDisplay;
  autoDismiss?: boolean;
  dismissDelay?: number;
  onDismiss?: () => void;
  actionLink?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  variant,
  message,
  display = "inline",
  autoDismiss = false,
  dismissDelay = 5000,
  onDismiss,
  actionLink,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss && variant === "success") {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, dismissDelay);

      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDelay, variant, onDismiss]);

  if (!isVisible) return null;

  const variantStyles = {
    pending: {
      bg: "bg-surface",
      border: "border-border",
      text: "text-text-primary",
      icon: (
        <svg
          className="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
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
      ),
    },
    success: {
      bg: "bg-success/10",
      border: "border-success",
      text: "text-success",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
    },
    error: {
      bg: "bg-error/10",
      border: "border-error",
      text: "text-error",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-primary/10",
      border: "border-primary",
      text: "text-primary",
      icon: (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const styles = variantStyles[variant];

  const displayStyles = {
    inline: "w-full",
    toast: "fixed bottom-4 right-4 max-w-md z-50 shadow-lg",
    banner: "fixed top-0 left-0 right-0 z-50 shadow-lg",
  };

  const content = (
    <div
      className={`
        ${displayStyles[display]}
        ${styles.bg} ${styles.border} ${styles.text}
        border rounded-lg p-4
        flex items-center gap-3
        ${className}
      `}
      role="alert"
      aria-live={variant === "error" ? "assertive" : "polite"}
    >
      <div className="flex-shrink-0">{styles.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {actionLink && (
          <a
            href={actionLink.href}
            onClick={actionLink.onClick}
            className="text-sm underline mt-1 block hover:opacity-80"
          >
            {actionLink.label}
          </a>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded p-1"
          aria-label="Dismiss"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );

  return content;
};
