import type { DayCount, DistributionEntry, QrScanEvent } from "@/types/analytics";

const RANGE_TO_MS: Record<"24h" | "7d" | "30d", number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function filterEventsByRange(
  events: QrScanEvent[],
  range: "24h" | "7d" | "30d",
  now: Date,
): QrScanEvent[] {
  const cutoff = now.getTime() - RANGE_TO_MS[range];
  return events.filter((event) => new Date(event.scannedAt).getTime() > cutoff);
}

/**
 * UTC-based bucketing throughout this module (both here and `countByHour`)
 * so server-rendered and client-rendered output always agree regardless of
 * the viewer's local timezone — this data renders inside a Client
 * Component (`AnalyticsView`), where a locale-dependent bucket would
 * produce a hydration mismatch.
 */
export function countScansOverTime(events: QrScanEvent[], days: number, now: Date): DayCount[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    buckets.set(date.toISOString().slice(0, 10), 0);
  }

  for (const event of events) {
    const key = event.scannedAt.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export function countByField<K extends keyof QrScanEvent>(
  events: QrScanEvent[],
  field: K,
): DistributionEntry[] {
  const counts = new Map<string, number>();
  for (const event of events) {
    const key = String(event[field]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = events.length;
  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total === 0 ? 0 : Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function countByHour(events: QrScanEvent[]): number[] {
  const hours = new Array<number>(24).fill(0);
  for (const event of events) {
    const hour = new Date(event.scannedAt).getUTCHours();
    hours[hour] += 1;
  }
  return hours;
}
