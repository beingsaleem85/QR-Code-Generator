import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={`rounded-lg border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground ${
        invalid ? "border-destructive" : "border-border"
      } ${className ?? ""}`}
      {...props}
    />
  );
}
