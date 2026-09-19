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
    publicToken: null,
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
    publicToken: null,
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

  it("QRCodeCard exposes compact 3-dots row actions (Download, Pause, Duplicate, Archive, Delete)", async () => {
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<QRCodeCard qrCode={qrCodes[0]} />);

    const actionsTrigger = screen.getByRole("button", { name: "Actions for Restaurant Menu" });
    expect(actionsTrigger).toBeInTheDocument();

    await user.click(actionsTrigger);

    expect(screen.getByRole("menuitem", { name: "Download" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: /pause/i })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Duplicate" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: /delete/i })).toBeEnabled();
  });

  it("QRCodeCard supports checkbox selection", async () => {
    const onToggleSelectMock = vi.fn();
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    render(
      <QRCodeCard
        qrCode={qrCodes[0]}
        selected={false}
        onToggleSelect={onToggleSelectMock}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Select Restaurant Menu" });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(onToggleSelectMock).toHaveBeenCalledWith("qr-1");
  });

  it("QRCodeTable renders one row per QR code with working detail links and compact 3-dots actions", () => {
    render(<QRCodeTable qrCodes={qrCodes} />);

    expect(screen.getByRole("link", { name: "Restaurant Menu" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes/qr-1",
    );
    expect(screen.getByRole("link", { name: "Business Card" })).toHaveAttribute(
      "href",
      "/dashboard/qr-codes/qr-2",
    );
    // Compact 3-dots action triggers are present for each row
    expect(screen.getAllByRole("button", { name: /actions for/i })).toHaveLength(2);
  });

  it("QRCodeTable supports row selection and header select all", async () => {
    const onToggleSelect = vi.fn();
    const onToggleSelectAll = vi.fn();
    const { userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();

    const { rerender } = render(
      <QRCodeTable
        qrCodes={qrCodes}
        selectedIds={new Set(["qr-1"])}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        allSelected={false}
        someSelected={true}
      />,
    );

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: "Select all QR codes on this page",
    });
    expect(selectAllCheckbox).not.toBeChecked();

    await user.click(selectAllCheckbox);
    expect(onToggleSelectAll).toHaveBeenCalled();

    const row1Checkbox = screen.getByRole("checkbox", { name: "Select Restaurant Menu" });
    expect(row1Checkbox).toBeChecked();

    const row2Checkbox = screen.getByRole("checkbox", { name: "Select Business Card" });
    expect(row2Checkbox).not.toBeChecked();

    await user.click(row2Checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith("qr-2");

    // Test allSelected state
    rerender(
      <QRCodeTable
        qrCodes={qrCodes}
        selectedIds={new Set(["qr-1", "qr-2"])}
        onToggleSelect={onToggleSelect}
        onToggleSelectAll={onToggleSelectAll}
        allSelected={true}
        someSelected={true}
      />,
    );
    expect(
      screen.getByRole("checkbox", { name: "Select all QR codes on this page" }),
    ).toBeChecked();
  });
});
