import React from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "disabled";
export type ButtonState =
  | "default"
  | "hover"
  | "active"
  | "disabled"
  | "loading";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  isLoading = false,
  disabled,
  children,
  className = "",
  ...props
}) => {
  const isDisabled = disabled || isLoading || variant === "disabled";

  const baseClasses =
    "px-4 py-2 rounded font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background min-h-[44px] min-w-[44px]";

  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-blue-600 active:bg-blue-700 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
    secondary:
      "bg-surface text-text-primary border border-border hover:bg-slate-700 active:bg-slate-600 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed",
    destructive:
      "bg-error text-white hover:bg-red-600 active:bg-red-700 focus:ring-error disabled:opacity-50 disabled:cursor-not-allowed",
    disabled:
      "bg-surface text-text-muted border border-border opacity-50 cursor-not-allowed",
  };

  const loadingSpinner = (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4"
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
  );

  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          {loadingSpinner}
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
