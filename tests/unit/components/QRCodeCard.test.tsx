// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { QRCodeTable } from "@/components/dashboard/QRCodeTable";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { QrCodeRecord } from "@/lib/qr/records";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => cleanup());

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
});

const qrCodes: QrCodeRecord[] = [
  {
    id: "qr-1",
    name: "Restaurant Menu",
    slug: null,
    mode: "dynamic",
    qrType: "url",
    status: "active",
    payloadData: { url: "https://example.com/menu" },
    designConfig: DEFAULT_DESIGN_CONFIG,
    destinationUrl: null,
    folderId: null,
    scanCount: 42,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-05T00:00:00.000Z",
  },
  {
    id: "qr-2",
    name: "Business Card",
    slug: null,
    mode: "static",
    qrType: "vcard",
    status: "archived",
    payloadData: { firstName: "Ada" },
    designConfig: DEFAULT_DESIGN_CONFIG,
    destinationUrl: null,
    folderId: null,
    scanCount: 0,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
  },
];

describe("dashboard populated state", () => {
  it("QRCodeCard renders the QR's name, type, mode, scan count, and status", () => {
    render(<QRCodeCard qrCode={qrCodes[0]} />);

    expect(screen.getByRole("link", { name: "Restaurant Menu" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes/qr-1",
    );
    expect(screen.getByText(/url.*dynamic.*42 scans/)).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("QRCodeCard exposes real row actions, not disabled placeholders", () => {
    render(<QRCodeCard qrCode={qrCodes[0]} />);

    expect(screen.getByRole("button", { name: "Duplicate" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Archive" })).toBeEnabled();
  });

  it("QRCodeTable renders one row per QR code with a working detail link", () => {
    render(<QRCodeTable qrCodes={qrCodes} />);

    expect(screen.getByRole("link", { name: "Restaurant Menu" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes/qr-1",
    );
    expect(screen.getByRole("link", { name: "Business Card" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes/qr-2",
    );
    expect(screen.getAllByRole("button", { name: "Duplicate" })).toHaveLength(2);
  });

  it("QRCodeTable shows Unarchive for an archived row", () => {
    render(<QRCodeTable qrCodes={qrCodes} />);
    expect(screen.getByRole("button", { name: "Unarchive" })).toBeInTheDocument();
  });
});
