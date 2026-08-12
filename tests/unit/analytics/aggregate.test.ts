import { describe, expect, it } from "vitest";
import {
  countByField,
  countByHour,
  countScansOverTime,
  filterEventsByRange,
} from "@/lib/analytics/aggregate";
import type { QrScanEvent } from "@/types/analytics";

const NOW = new Date("2026-08-12T12:00:00.000Z");

function event(scannedAt: string, overrides: Partial<QrScanEvent> = {}): QrScanEvent {
  return {
    scannedAt,
    countryCode: "US",
    deviceType: "mobile",
    os: "iOS",
    browser: "Safari",
    ...overrides,
  };
}

describe("filterEventsByRange", () => {
  const events = [
    event("2026-08-12T11:00:00.000Z"), // 1h ago
    event("2026-08-10T12:00:00.000Z"), // 2d ago
    event("2026-07-20T12:00:00.000Z"), // 23d ago
    event("2026-06-01T12:00:00.000Z"), // way outside 30d
  ];

  it("keeps only events within the last 24h", () => {
    expect(filterEventsByRange(events, "24h", NOW)).toHaveLength(1);
  });

  it("keeps events within the last 7d", () => {
    expect(filterEventsByRange(events, "7d", NOW)).toHaveLength(2);
  });

  it("keeps events within the last 30d", () => {
    expect(filterEventsByRange(events, "30d", NOW)).toHaveLength(3);
  });
});

describe("countScansOverTime", () => {
  it("returns one bucket per day, zero-filled, in chronological order", () => {
    const events = [event("2026-08-12T08:00:00.000Z"), event("2026-08-12T20:00:00.000Z")];
    const result = countScansOverTime(events, 3, NOW);

    expect(result).toEqual([
      { date: "2026-08-10", count: 0 },
      { date: "2026-08-11", count: 0 },
      { date: "2026-08-12", count: 2 },
    ]);
  });

  it("ignores events outside the requested window", () => {
    const events = [event("2026-07-01T00:00:00.000Z")];
    const result = countScansOverTime(events, 3, NOW);

    expect(result.every((bucket) => bucket.count === 0)).toBe(true);
  });
});

describe("countByField", () => {
  it("counts and sorts distribution entries descending, with percentages", () => {
    const events = [
      event("2026-08-12T00:00:00.000Z", { countryCode: "US" }),
      event("2026-08-12T00:00:00.000Z", { countryCode: "US" }),
      event("2026-08-12T00:00:00.000Z", { countryCode: "CA" }),
      event("2026-08-12T00:00:00.000Z", { countryCode: "GB" }),
    ];

    expect(countByField(events, "countryCode")).toEqual([
      { label: "US", count: 2, percentage: 50 },
      { label: "CA", count: 1, percentage: 25 },
      { label: "GB", count: 1, percentage: 25 },
    ]);
  });

  it("returns an empty array for no events", () => {
    expect(countByField([], "deviceType")).toEqual([]);
  });
});

describe("countByHour", () => {
  it("buckets scans into 24 UTC hour slots", () => {
    const events = [
      event("2026-08-12T09:15:00.000Z"),
      event("2026-08-11T09:45:00.000Z"),
      event("2026-08-10T23:00:00.000Z"),
    ];

    const result = countByHour(events);

    expect(result).toHaveLength(24);
    expect(result[9]).toBe(2);
    expect(result[23]).toBe(1);
    expect(result.reduce((sum, count) => sum + count, 0)).toBe(3);
  });
});
