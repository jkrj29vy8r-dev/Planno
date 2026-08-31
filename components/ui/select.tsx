import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

/** Native <select>, styled to match Input -- a real OS picker (better
 *  on mobile than a custom listbox) for the small, fixed option sets
 *  this app's forms need so far. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, containerClassName, label, hint, error, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const descriptionId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-foreground/90">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            aria-invalid={!!error || undefined}
            aria-describedby={descriptionId}
            className={cn(
              "h-10 w-full appearance-none rounded-lg border border-input bg-card px-3.5 pr-9 text-sm text-foreground",
              "transition-all duration-150 outline-none",
              "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/25",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 size-4 text-muted-foreground"
            aria-hidden="true"
          />
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
Select.displayName = "Select";
