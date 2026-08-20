import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground shadow-sm transition-colors duration-150 hover:border-foreground/20 focus:border-primary focus:ring-2 focus:ring-primary/15 ${className ?? ""}`}
      {...props}
    />
  );
});
