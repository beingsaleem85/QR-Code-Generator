// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilesView } from "@/components/files/FilesView";
import type { QrAsset } from "@/types/asset";
import type { QRCodeSummary } from "@/types/qr-record";

const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

const deleteQrAssetMock = vi.fn();
vi.mock("@/lib/files/actions", () => ({
  deleteQrAsset: (...args: unknown[]) => deleteQrAssetMock(...args),
}));

afterEach(() => cleanup());

beforeEach(() => {
  refreshMock.mockReset();
  deleteQrAssetMock.mockReset();
});

const QR_CODES: QRCodeSummary[] = [
  {
    id: "1",
    name: "Restaurant Menu",
    qrType: "pdf",
    mode: "dynamic",
    status: "active",
    scanCount: 482,
    createdAt: "2026-06-01",
    updatedAt: "2026-08-10",
    destinationSummary: "menu-v3.pdf",
  },
];

const ASSETS: QrAsset[] = [
  {
    id: "a1",
    fileName: "menu-v3.pdf",
    assetType: "pdf",
    mimeType: "application/pdf",
    sizeBytes: 842_000,
    createdAt: "2026-06-01",
    linkedQrCodeId: "1",
    uploadState: "ready",
  },
  {
    id: "a2",
    fileName: "logo-primary.png",
    assetType: "logo",
    mimeType: "image/png",
    sizeBytes: 128_000,
    createdAt: "2026-07-10",
    linkedQrCodeId: null,
    uploadState: "ready",
  },
];

describe("FilesView", () => {
  it("renders assets with their linked QR code name or Unlinked", () => {
    render(<FilesView initialAssets={ASSETS} qrCodes={QR_CODES} />);

    expect(screen.getAllByText("Restaurant Menu").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Unlinked").length).toBeGreaterThan(0);
  });

  it("deletes for real and shows the empty state once every asset is gone", async () => {
    deleteQrAssetMock.mockResolvedValue({ data: { id: "a1" } });
    const user = userEvent.setup();
    render(<FilesView initialAssets={[ASSETS[0]]} qrCodes={QR_CODES} />);

    await user.click(screen.getAllByRole("button", { name: "Delete menu-v3.pdf" })[0]);

    const dialog = screen.getAllByRole("dialog", { name: "Confirm delete menu-v3.pdf" })[0];
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(deleteQrAssetMock).toHaveBeenCalledWith("a1");
    expect(await screen.findByText("No files yet")).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows an error and keeps the asset when delete fails", async () => {
    deleteQrAssetMock.mockResolvedValue({ error: "Couldn't delete that file — please try again." });
    const user = userEvent.setup();
    render(<FilesView initialAssets={[ASSETS[0]]} qrCodes={QR_CODES} />);

    await user.click(screen.getAllByRole("button", { name: "Delete menu-v3.pdf" })[0]);
    const dialog = screen.getAllByRole("dialog", { name: "Confirm delete menu-v3.pdf" })[0];
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Couldn't delete that file — please try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText("No files yet")).not.toBeInTheDocument();
  });

  it("cancelling the confirmation dialog keeps the asset in the list", async () => {
    const user = userEvent.setup();
    render(<FilesView initialAssets={[ASSETS[0]]} qrCodes={QR_CODES} />);

    await user.click(screen.getAllByRole("button", { name: "Delete menu-v3.pdf" })[0]);
    const dialog = screen.getAllByRole("dialog", { name: "Confirm delete menu-v3.pdf" })[0];
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText("No files yet")).not.toBeInTheDocument();
    expect(screen.getAllByText("menu-v3.pdf").length).toBeGreaterThan(0);
    expect(deleteQrAssetMock).not.toHaveBeenCalled();
  });
});
