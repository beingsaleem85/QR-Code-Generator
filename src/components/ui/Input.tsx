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
      className={`h-10 rounded-lg border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground ${
        invalid ? "border-destructive" : "border-border"
      } ${className ?? ""}`}
      {...props}
    />
  );
});
