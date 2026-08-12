"use client";

import { Select } from "@/components/ui/Select";
import type { AnalyticsDateRange } from "@/types/analytics";

const DATE_RANGES: { value: AnalyticsDateRange; label: string }[] = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
];

interface AnalyticsFiltersProps {
  dateRange: AnalyticsDateRange;
  onDateRangeChange: (range: AnalyticsDateRange) => void;
  countryOptions: string[];
  country: string;
  onCountryChange: (country: string) => void;
  deviceOptions: string[];
  device: string;
  onDeviceChange: (device: string) => void;
}

export function AnalyticsFilters({
  dateRange,
  onDateRangeChange,
  countryOptions,
  country,
  onCountryChange,
  deviceOptions,
  device,
  onDeviceChange,
}: AnalyticsFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="group" aria-label="Date range" className="flex gap-1.5">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            aria-pressed={dateRange === range.value}
            onClick={() => onDateRangeChange(range.value)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
              dateRange === range.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Country
        <Select
          aria-label="Filter by country"
          value={country}
          onChange={(event) => onCountryChange(event.target.value)}
        >
          <option value="">All</option>
          {countryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        Device
        <Select
          aria-label="Filter by device"
          value={device}
          onChange={(event) => onDeviceChange(event.target.value)}
        >
          <option value="">All</option>
          {deviceOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
