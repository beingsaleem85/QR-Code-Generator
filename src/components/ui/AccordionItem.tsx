import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionItemProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

/** Native <details>/<summary> — keyboard toggling and semantics for free. */
export function AccordionItem({ title, defaultOpen, children }: AccordionItemProps) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border border-border bg-surface transition-colors duration-150 open:border-primary/25"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-background [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-muted-foreground transition-transform duration-150 group-open:rotate-180 group-open:text-primary"
        />
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
