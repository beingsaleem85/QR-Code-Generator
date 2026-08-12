import type { ReactNode } from "react";

interface AnalyticsChartShellProps {
  title: string;
  children?: ReactNode;
}

/**
 * Structure-phase wrapper for a chart. Real charts (scans over time,
 * country/device/browser distribution) are built in Module 2.8, backed
 * by real data in Module 3.7.
 */
export function AnalyticsChartShell({ title, children }: AnalyticsChartShellProps) {
  return (
    <div className="rounded-md border border-gray-200 p-4">
      <p className="mb-2 text-sm font-medium text-gray-900">{title}</p>
      <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-gray-300 text-xs text-gray-500">
        {children ?? "No scans yet"}
      </div>
    </div>
  );
}
