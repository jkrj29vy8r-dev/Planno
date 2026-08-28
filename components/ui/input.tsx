import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      type = "text",
      label,
      hint,
      error,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const descriptionId = error
      ? `${inputId}-error`
      : hint
        ? `${inputId}-hint`
        : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground/90">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={!!error || undefined}
            aria-describedby={descriptionId}
            className={cn(
              "h-10 w-full rounded-lg border border-input bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground/70",
              "transition-all duration-150 outline-none",
              "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error &&
                "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/25",
              className,
            )}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 flex size-4 items-center justify-center text-muted-foreground [&_svg]:size-4">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p id={descriptionId} className="text-xs text-destructive">
            {error}
          </p>
        ) : hint ? (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
