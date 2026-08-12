// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import type { QrScanEvent } from "@/types/analytics";
import type { QRCodeSummary } from "@/types/qr-record";

afterEach(() => cleanup());

const NOW = "2026-08-12T12:00:00.000Z";

const BASE_QR: QRCodeSummary = {
  id: "1",
  name: "Restaurant Menu",
  qrType: "pdf",
  mode: "dynamic",
  status: "active",
  scanCount: 482,
  createdAt: "2026-06-01",
  updatedAt: "2026-08-10",
  destinationSummary: "menu-v3.pdf",
};

const EVENTS: QrScanEvent[] = [
  {
    scannedAt: "2026-08-12T09:00:00.000Z",
    countryCode: "US",
    deviceType: "mobile",
    os: "iOS",
    browser: "Safari",
  },
  {
    scannedAt: "2026-08-11T09:00:00.000Z",
    countryCode: "US",
    deviceType: "mobile",
    os: "iOS",
    browser: "Safari",
  },
  {
    scannedAt: "2026-08-05T09:00:00.000Z",
    countryCode: "CA",
    deviceType: "desktop",
    os: "Windows",
    browser: "Edge",
  },
  {
    scannedAt: "2026-07-01T09:00:00.000Z",
    countryCode: "GB",
    deviceType: "tablet",
    os: "iOS",
    browser: "Safari",
  },
];

describe("AnalyticsView", () => {
  it("shows the true empty state when the QR code has never been scanned", () => {
    render(<AnalyticsView qrCode={{ ...BASE_QR, scanCount: 0 }} events={[]} now={NOW} />);

    expect(screen.getByText(/no scans yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Date range" })).not.toBeInTheDocument();
  });

  it("renders summary cards from the full event history, independent of the active filter", () => {
    render(<AnalyticsView qrCode={BASE_QR} events={EVENTS} now={NOW} />);

    expect(screen.getByText("Total scans")).toBeInTheDocument();
    expect(screen.getByText("482")).toBeInTheDocument();
    expect(screen.getByText("Last 24h")).toBeInTheDocument();
    expect(screen.getByText("Last 7d")).toBeInTheDocument();
    expect(screen.getByText("Last 30d")).toBeInTheDocument();
  });

  it("defaults to the 7d range and narrows results when switching to 24h", async () => {
    const user = userEvent.setup();
    render(<AnalyticsView qrCode={BASE_QR} events={EVENTS} now={NOW} />);

    const dateRangeGroup = screen.getByRole("group", { name: "Date range" });
    expect(within(dateRangeGroup).getByRole("button", { name: "7d" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(within(dateRangeGroup).getByRole("button", { name: "24h" }));

    expect(within(dateRangeGroup).getByRole("button", { name: "24h" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(dateRangeGroup).getByRole("button", { name: "7d" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows a range-specific empty state for a QR code with scans outside every filter window", () => {
    const archived: QRCodeSummary = { ...BASE_QR, id: "5", scanCount: 39 };
    const oldEvents: QrScanEvent[] = [
      {
        scannedAt: "2026-05-02T10:00:00.000Z",
        countryCode: "US",
        deviceType: "mobile",
        os: "iOS",
        browser: "Safari",
      },
    ];

    render(<AnalyticsView qrCode={archived} events={oldEvents} now={NOW} />);

    expect(screen.getAllByText("No scans in this range").length).toBeGreaterThan(0);
  });

  it("filters the country distribution when a country filter is applied", async () => {
    const user = userEvent.setup();
    render(<AnalyticsView qrCode={BASE_QR} events={EVENTS} now={NOW} />);

    await user.click(
      within(screen.getByRole("group", { name: "Date range" })).getByRole("button", {
        name: "30d",
      }),
    );

    const countrySelect = screen.getByLabelText("Filter by country");
    await user.selectOptions(countrySelect, "CA");

    const countryCard = screen.getByText("Country", { selector: "p" }).closest("div");
    expect(countryCard).not.toBeNull();
    expect(within(countryCard as HTMLElement).getByText("CA")).toBeInTheDocument();
    expect(within(countryCard as HTMLElement).queryByText("US")).not.toBeInTheDocument();
  });
});
