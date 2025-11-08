import React, { useState } from "react";

export type InputVariant = "standard" | "number" | "address";
export type InputState = "default" | "focus" | "valid" | "invalid" | "disabled";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  label?: string;
  errorMessage?: string;
  isValid?: boolean;
  showValidationIndicator?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  touched?: boolean; // Only show validation errors if touched (e.g., after submit attempt)
}

export const Input: React.FC<InputProps> = ({
  variant = "standard",
  label,
  errorMessage,
  isValid,
  showValidationIndicator = true,
  onValidationChange,
  touched = false,
  className = "",
  disabled,
  onFocus,
  onBlur,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(props.value || "");

  // Sync internal value with prop value
  React.useEffect(() => {
    if (props.value !== undefined) {
      setInternalValue(props.value as string);
    }
  }, [props.value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInternalValue(value);

    // Real-time validation for address variant
    if (variant === "address" && onValidationChange) {
      const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(value);
      onValidationChange(isValidAddress);
    }

    onChange?.(e);
  };

  const handleClear = () => {
    setInternalValue("");
    // Create a synthetic event to trigger onChange
    const syntheticEvent = {
      target: { value: "" },
      currentTarget: { value: "" },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange?.(syntheticEvent);
  };

  const baseClasses =
    "w-full px-4 py-2 bg-surface border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

  const stateClasses = {
    default: "border-border",
    focus: "border-primary ring-2 ring-primary",
    valid: "border-success",
    invalid: "border-error",
    disabled: "opacity-50 cursor-not-allowed",
  };

  const getStateClass = () => {
    if (disabled) return stateClasses.disabled;
    // Only show invalid state if touched (e.g., after submit attempt) and validation failed
    if (touched && (isValid === false || errorMessage))
      return stateClasses.invalid;
    if (isValid === true) return stateClasses.valid;
    if (isFocused) return stateClasses.focus;
    return stateClasses.default;
  };

  const inputType = variant === "number" ? "number" : "text";

  const hasValue = internalValue && internalValue.length > 0;
  const showClearButton = hasValue && !disabled;

  const clearButton = showClearButton && (
    <button
      type="button"
      onClick={handleClear}
      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-surface-hover rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Clear input"
    >
      <svg
        className="w-5 h-5 text-text-muted hover:text-text-primary"
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
  );

  const validationIcon = showValidationIndicator && !showClearButton && (
    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
      {isValid === true && (
        <svg
          className="w-5 h-5 text-success"
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
      )}
      {touched && isValid === false && (
        <svg
          className="w-5 h-5 text-error"
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
      )}
    </div>
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          disabled={disabled}
          className={`${baseClasses} ${getStateClass()} ${className} ${
            showClearButton ||
            (showValidationIndicator && isValid !== undefined)
              ? "pr-10"
              : ""
          }`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={internalValue}
          aria-invalid={isValid === false}
          aria-describedby={errorMessage ? `${props.id}-error` : undefined}
          {...props}
        />
        {clearButton}
        {validationIcon}
      </div>
      {touched && errorMessage && (
        <p
          id={`${props.id}-error`}
          className="mt-1 text-sm text-error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};
