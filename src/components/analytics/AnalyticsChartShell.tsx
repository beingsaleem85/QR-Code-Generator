import type { ReactNode } from "react";

interface AnalyticsChartShellProps {
  title: string;
  children?: ReactNode;
  emptyLabel?: string;
}

/**
 * `children` omitted renders the dashed empty-state box (used as-is by the
 * Module 2.3 marketing homepage teaser, which never has real data to show).
 * Module 2.8's `AnalyticsView` passes real chart content once data exists.
 */
export function AnalyticsChartShell({
  title,
  children,
  emptyLabel = "No scans yet",
}: AnalyticsChartShellProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="mb-3 text-sm font-medium text-foreground">{title}</p>
      {children ?? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
