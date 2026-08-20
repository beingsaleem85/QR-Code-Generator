import type { ReactNode } from "react";
import { QrPlaceholderGraphic } from "@/components/ui/QrPlaceholderGraphic";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 p-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary">
        <QrPlaceholderGraphic size={24} />
      </span>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description ? <p className="max-w-sm text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}
