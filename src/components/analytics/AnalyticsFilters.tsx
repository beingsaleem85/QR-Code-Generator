"use client";

interface AnalyticsFiltersProps {
  dateRange?: string;
  onDateRangeChange?: (range: string) => void;
}

const DATE_RANGES = ["24h", "7d", "30d"] as const;

export function AnalyticsFilters({ dateRange = "7d", onDateRangeChange }: AnalyticsFiltersProps) {
  return (
    <div role="group" aria-label="Analytics filters" className="flex gap-2">
      {DATE_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          onClick={() => onDateRangeChange?.(range)}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            dateRange === range
              ? "border-gray-900 bg-gray-900 text-white"
              : "border-gray-300 text-gray-700"
          }`}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
