import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`h-10 rounded-lg border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors duration-150 placeholder:text-muted-foreground focus:ring-2 focus:ring-offset-0 ${
        invalid
          ? "border-destructive focus:ring-destructive/20"
          : "border-border hover:border-foreground/20 focus:border-primary focus:ring-primary/15"
      } ${className ?? ""}`}
      {...props}
    />
  );
});
