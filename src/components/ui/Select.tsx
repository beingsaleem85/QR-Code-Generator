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
      className={`h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground ${className ?? ""}`}
      {...props}
    />
  );
});
