import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  helperText?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, error, helperText, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
