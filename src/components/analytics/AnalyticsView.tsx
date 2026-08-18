"use client";

import { useMemo, useState } from "react";
import { AnalyticsChartShell } from "@/components/analytics/AnalyticsChartShell";
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters";
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards";
import { BarChart } from "@/components/analytics/BarChart";
import { DistributionList } from "@/components/analytics/DistributionList";
import { Card } from "@/components/ui/Card";
import {
  countByField,
  countByHour,
  countScansOverTime,
  filterEventsByRange,
} from "@/lib/analytics/aggregate";
import type { AnalyticsDateRange, QrScanEvent } from "@/types/analytics";
import type { QRCodeSummary } from "@/types/qr-record";

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function hasCountry(event: QrScanEvent): event is QrScanEvent & { countryCode: string } {
  return event.countryCode !== null;
}

interface AnalyticsViewProps {
  qrCode: QRCodeSummary;
  events: QrScanEvent[];
  now: string;
}

export function AnalyticsView({ qrCode, events, now }: AnalyticsViewProps) {
  const [dateRange, setDateRange] = useState<AnalyticsDateRange>("7d");
  const [country, setCountry] = useState("");
  const [device, setDevice] = useState("");

  const nowDate = useMemo(() => new Date(now), [now]);

  // Country is only ever populated from a platform-provided edge header
  // (Module 3.7) — genuinely absent, not just empty, on hosting that
  // doesn't provide one. Aggregating/filtering by it only when at least one
  // real event has it avoids rendering a misleading "100% Unknown" chart.
  const hasCountryData = useMemo(() => events.some(hasCountry), [events]);
  const eventsWithCountry = useMemo(() => events.filter(hasCountry), [events]);

  const countryOptions = useMemo(
    () => Array.from(new Set(eventsWithCountry.map((event) => event.countryCode))).sort(),
    [eventsWithCountry],
  );
  const deviceOptions = useMemo(
    () => Array.from(new Set(events.map((event) => event.deviceType))).sort(),
    [events],
  );

  const chartEvents = useMemo(() => {
    let result = filterEventsByRange(events, dateRange, nowDate);
    if (country) result = result.filter((event) => event.countryCode === country);
    if (device) result = result.filter((event) => event.deviceType === device);
    return result;
  }, [events, dateRange, nowDate, country, device]);

  const overallTopDevice = countByField(events, "deviceType")[0]?.label ?? "—";

  const summaryCards = [
    { label: "Total scans", value: qrCode.scanCount.toLocaleString() },
    {
      label: "Last 24h",
      value: filterEventsByRange(events, "24h", nowDate).length.toLocaleString(),
    },
    { label: "Last 7d", value: filterEventsByRange(events, "7d", nowDate).length.toLocaleString() },
    {
      label: "Last 30d",
      value: filterEventsByRange(events, "30d", nowDate).length.toLocaleString(),
    },
    ...(hasCountryData
      ? [
          {
            label: "Top country",
            value: countByField(eventsWithCountry, "countryCode")[0]?.label ?? "—",
          },
        ]
      : []),
    { label: "Top device", value: overallTopDevice ? capitalize(overallTopDevice) : "—" },
  ];

  if (qrCode.scanCount === 0) {
    return (
      <div className="flex flex-col gap-6">
        <AnalyticsSummaryCards cards={summaryCards} />
        <Card className="flex h-40 items-center justify-center p-6 text-sm text-muted-foreground">
          No scans yet — analytics will appear here once this QR code starts getting scanned.
        </Card>
      </div>
    );
  }

  const scansOverTimeData =
    dateRange === "24h"
      ? countByHour(chartEvents).map((count, hour) => ({ label: String(hour), value: count }))
      : countScansOverTime(chartEvents, dateRange === "7d" ? 7 : 30, nowDate).map((bucket) => ({
          label: bucket.date.slice(5),
          value: bucket.count,
        }));

  const countryDistribution = hasCountryData
    ? countByField(chartEvents.filter(hasCountry), "countryCode")
    : [];
  const deviceDistribution = countByField(chartEvents, "deviceType");
  const osDistribution = countByField(chartEvents, "os");
  const browserDistribution = countByField(chartEvents, "browser");
  const hourDistribution = countByHour(chartEvents).map((count, hour) => ({
    label: String(hour),
    value: count,
  }));

  const rangeEmptyLabel = "No scans in this range";

  return (
    <div className="flex flex-col gap-6">
      <AnalyticsSummaryCards cards={summaryCards} />

      <AnalyticsFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        showCountryFilter={hasCountryData}
        countryOptions={countryOptions}
        country={country}
        onCountryChange={setCountry}
        deviceOptions={deviceOptions}
        device={device}
        onDeviceChange={setDevice}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnalyticsChartShell title="Scans over time" emptyLabel={rangeEmptyLabel}>
          {chartEvents.length > 0 ? (
            <BarChart
              data={scansOverTimeData}
              ariaLabel="Scans over time"
              tickEvery={dateRange === "24h" ? 6 : dateRange === "7d" ? 1 : 5}
            />
          ) : undefined}
        </AnalyticsChartShell>

        <AnalyticsChartShell title="Hour of day" emptyLabel={rangeEmptyLabel}>
          {chartEvents.length > 0 ? (
            <BarChart data={hourDistribution} ariaLabel="Scans by hour of day" tickEvery={6} />
          ) : undefined}
        </AnalyticsChartShell>

        {hasCountryData ? (
          <AnalyticsChartShell title="Country" emptyLabel={rangeEmptyLabel}>
            {countryDistribution.length > 0 ? (
              <DistributionList entries={countryDistribution} />
            ) : undefined}
          </AnalyticsChartShell>
        ) : null}

        <AnalyticsChartShell title="Device type" emptyLabel={rangeEmptyLabel}>
          {deviceDistribution.length > 0 ? (
            <DistributionList entries={deviceDistribution} labelFormatter={capitalize} />
          ) : undefined}
        </AnalyticsChartShell>

        <AnalyticsChartShell title="Browser & OS" emptyLabel={rangeEmptyLabel}>
          {osDistribution.length > 0 || browserDistribution.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">OS</p>
                <DistributionList entries={osDistribution} />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Browser</p>
                <DistributionList entries={browserDistribution} />
              </div>
            </div>
          ) : undefined}
        </AnalyticsChartShell>
      </div>
    </div>
  );
}
