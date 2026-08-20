import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`rounded-lg border bg-surface px-3 py-2 text-sm text-foreground shadow-sm transition-colors duration-150 placeholder:text-muted-foreground focus:ring-2 ${
        invalid
          ? "border-destructive focus:ring-destructive/20"
          : "border-border hover:border-foreground/20 focus:border-primary focus:ring-primary/15"
      } ${className ?? ""}`}
      {...props}
    />
  );
});
