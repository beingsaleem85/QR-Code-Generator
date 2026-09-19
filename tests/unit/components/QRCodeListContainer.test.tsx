// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodeListContainer } from "@/components/dashboard/QRCodeListContainer";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { QrCodeRecord } from "@/lib/qr/records";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const bulkDeleteQrCodesMock = vi.fn();
const bulkSetQrCodeStatusMock = vi.fn();
vi.mock("@/lib/qr/bulk-actions", () => ({
  bulkDeleteQrCodes: (...args: unknown[]) => bulkDeleteQrCodesMock(...args),
  bulkSetQrCodeStatus: (...args: unknown[]) => bulkSetQrCodeStatusMock(...args),
}));

afterEach(() => cleanup());

beforeEach(() => {
  refreshMock.mockReset();
  bulkDeleteQrCodesMock.mockReset();
  bulkSetQrCodeStatusMock.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:mock-zip");
  URL.revokeObjectURL = vi.fn();

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    drawImage: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,MOCK");
  class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }
  vi.stubGlobal("Image", MockImage);
});

const sampleItems: QrCodeRecord[] = [
  {
    id: "qr-1",
    name: "Menu One",
    slug: "menu-1",
    publicToken: null,
    mode: "dynamic",
    qrType: "url",
    status: "active",
    payloadData: { url: "https://example.com/1" },
    designConfig: DEFAULT_DESIGN_CONFIG,
    destinationUrl: "https://example.com/1",
    folderId: null,
    scanCount: 10,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
  },
  {
    id: "qr-2",
    name: "Menu Two",
    slug: "menu-2",
    publicToken: null,
    mode: "dynamic",
    qrType: "url",
    status: "active",
    payloadData: { url: "https://example.com/2" },
    designConfig: DEFAULT_DESIGN_CONFIG,
    destinationUrl: "https://example.com/2",
    folderId: null,
    scanCount: 20,
    createdAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-08-02T00:00:00.000Z",
  },
];

describe("QRCodeListContainer", () => {
  it("shows no bulk actions bar when no items are selected", () => {
    render(<QRCodeListContainer items={sampleItems} />);
    expect(screen.queryByRole("region", { name: "Bulk actions toolbar" })).not.toBeInTheDocument();
  });

  it("selects all visible items on current page when header checkbox is clicked", async () => {
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    const selectAllCheckbox = screen.getByRole("checkbox", {
      name: "Select all QR codes on this page",
    });
    await user.click(selectAllCheckbox);

    expect(screen.getByRole("region", { name: "Bulk actions toolbar" })).toBeInTheDocument();
    expect(screen.getByTestId("selected-count")).toHaveTextContent("2 selected");

    // Clicking again clears selection
    await user.click(selectAllCheckbox);
    expect(screen.queryByRole("region", { name: "Bulk actions toolbar" })).not.toBeInTheDocument();
  });

  it("clears selection when Clear selection button is clicked", async () => {
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    await user.click(screen.getByRole("checkbox", { name: "Select all QR codes on this page" }));
    expect(screen.getByTestId("selected-count")).toHaveTextContent("2 selected");

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    expect(screen.queryByRole("region", { name: "Bulk actions toolbar" })).not.toBeInTheDocument();
  });

  it("reconciles selection when items change (prunes old IDs)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<QRCodeListContainer items={sampleItems} />);

    await user.click(screen.getByRole("checkbox", { name: "Select all QR codes on this page" }));
    expect(screen.getByTestId("selected-count")).toHaveTextContent("2 selected");

    // Simulate page change or filtering where qr-2 is no longer on the page
    rerender(<QRCodeListContainer items={[sampleItems[0]]} />);

    await waitFor(() => {
      expect(screen.getByTestId("selected-count")).toHaveTextContent("1 selected");
    });
  });

  it("handles Bulk Delete with confirmation modal", async () => {
    bulkDeleteQrCodesMock.mockResolvedValue({
      data: { deletedIds: ["qr-1"], failedIds: [] },
    });
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    // Select row 1
    const row1Checkbox = screen.getAllByRole("checkbox", { name: "Select Menu One" })[0];
    await user.click(row1Checkbox);

    // Click Delete selected to open modal
    await user.click(screen.getByRole("button", { name: "Delete 1 selected QR codes" }));

    // Confirmation dialog appears
    const dialog = screen.getByRole("dialog", { name: "Confirm bulk deletion" });
    expect(dialog).toBeInTheDocument();
    expect(dialog.textContent).toContain("Delete 1 selected QR code?");

    // Confirm deletion
    const confirmBtn = screen.getByRole("button", { name: "Delete (1)" });
    await user.click(confirmBtn);

    expect(bulkDeleteQrCodesMock).toHaveBeenCalledWith(["qr-1"]);
    expect(refreshMock).toHaveBeenCalled();
  });

  it("handles Bulk Pause and Bulk Resume", async () => {
    bulkSetQrCodeStatusMock.mockResolvedValue({
      data: { updatedIds: ["qr-1", "qr-2"], skippedIds: [], failedIds: [] },
    });
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    await user.click(screen.getByRole("checkbox", { name: "Select all QR codes on this page" }));

    // Bulk Pause
    await user.click(screen.getByRole("button", { name: "Pause 2 selected dynamic QR codes" }));
    expect(bulkSetQrCodeStatusMock).toHaveBeenCalledWith(["qr-1", "qr-2"], "paused");
    expect(refreshMock).toHaveBeenCalled();

    // Bulk Resume
    await user.click(screen.getByRole("button", { name: "Resume 2 selected dynamic QR codes" }));
    expect(bulkSetQrCodeStatusMock).toHaveBeenCalledWith(["qr-1", "qr-2"], "active");
  });

  it("handles Bulk Download for single item using PNG download", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    // Select row 1
    const row1Checkbox = screen.getAllByRole("checkbox", { name: "Select Menu One" })[0];
    await user.click(row1Checkbox);

    await user.click(screen.getByRole("button", { name: "Download 1 selected QR codes" }));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
    });
    clickSpy.mockRestore();
  });

  it("handles Bulk Download for multiple items creating a ZIP archive", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<QRCodeListContainer items={sampleItems} />);

    // Select all items
    await user.click(screen.getByRole("checkbox", { name: "Select all QR codes on this page" }));

    await user.click(screen.getByRole("button", { name: "Download 2 selected QR codes" }));

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });
    clickSpy.mockRestore();
  });
});