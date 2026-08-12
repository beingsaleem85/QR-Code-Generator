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
    <details open={defaultOpen} className="group rounded-lg border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
