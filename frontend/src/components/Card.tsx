import React, { useState } from "react";

export type CardVariant = "standard" | "elevated" | "collapsible";

export interface CardProps {
  variant?: CardVariant;
  title?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  variant = "standard",
  title,
  children,
  defaultExpanded = true,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const baseClasses = "bg-surface border border-border rounded-lg p-6";

  const variantClasses = {
    standard: "bg-surface",
    elevated: "bg-surface shadow-lg border-2 border-primary/20",
    collapsible: "bg-surface",
  };

  const handleToggle = () => {
    if (variant === "collapsible") {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (variant === "collapsible" && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {title && (
        <div
          className={`
            flex items-center justify-between mb-4
            ${variant === "collapsible" ? "cursor-pointer" : ""}
          `}
          onClick={variant === "collapsible" ? handleToggle : undefined}
          onKeyDown={variant === "collapsible" ? handleKeyDown : undefined}
          role={variant === "collapsible" ? "button" : undefined}
          tabIndex={variant === "collapsible" ? 0 : undefined}
          aria-expanded={variant === "collapsible" ? isExpanded : undefined}
        >
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          {variant === "collapsible" && (
            <button
              className="text-text-secondary hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary rounded p-1 transition-transform"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              <svg
                className={`w-5 h-5 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      )}
      {(variant !== "collapsible" || isExpanded) && (
        <div className="text-text-secondary">{children}</div>
      )}
    </div>
  );
};
