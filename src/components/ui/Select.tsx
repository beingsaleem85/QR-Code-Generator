import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={`h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground ${className ?? ""}`}
      {...props}
    />
  );
}
