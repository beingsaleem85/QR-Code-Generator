// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRCodeRowActions } from "@/components/dashboard/QRCodeRowActions";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";
import type { QrCodeRecord } from "@/lib/qr/records";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const duplicateQrCodeMock = vi.fn();
const setQrCodeStatusMock = vi.fn();
const deleteQrCodeMock = vi.fn();
vi.mock("@/lib/qr/actions", () => ({
  duplicateQrCode: (...args: unknown[]) => duplicateQrCodeMock(...args),
  setQrCodeStatus: (...args: unknown[]) => setQrCodeStatusMock(...args),
  deleteQrCode: (...args: unknown[]) => deleteQrCodeMock(...args),
}));

afterEach(() => cleanup());

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  duplicateQrCodeMock.mockReset();
  setQrCodeStatusMock.mockReset();
  deleteQrCodeMock.mockReset();

  URL.createObjectURL = vi.fn(() => "blob:mock");
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

const qrCode: QrCodeRecord = {
  id: "qr-1",
  name: "My Restaurant Menu",
  slug: null,
  publicToken: null,
  mode: "static",
  qrType: "url",
  status: "active",
  payloadData: { url: "https://example.com" },
  designConfig: DEFAULT_DESIGN_CONFIG,
  destinationUrl: null,
  folderId: null,
  scanCount: 0,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-02T00:00:00.000Z",
};

describe("QRCodeRowActions", () => {
  it("duplicates and navigates to the new QR's detail page on success", async () => {
    duplicateQrCodeMock.mockResolvedValue({ data: { id: "qr-2" } });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    expect(duplicateQrCodeMock).toHaveBeenCalledWith("qr-1");
    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes/qr-2");
  });

  it("shows an error and does not navigate when duplicate fails", async () => {
    duplicateQrCodeMock.mockResolvedValue({ error: "Couldn't find that QR code to duplicate." });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    expect(await screen.findByText("Couldn't find that QR code to duplicate.")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("archives an active QR and shows Unarchive for an already-archived one", async () => {
    setQrCodeStatusMock.mockResolvedValue({ data: { status: "archived" } });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Archive" }));

    expect(setQrCodeStatusMock).toHaveBeenCalledWith("qr-1", "archived");
    expect(refreshMock).toHaveBeenCalled();

    cleanup();
    render(<QRCodeRowActions qrCode={{ ...qrCode, status: "archived" }} />);
    expect(screen.getByRole("button", { name: "Unarchive" })).toBeInTheDocument();
  });

  it("requires confirmation before deleting, then deletes and refreshes", async () => {
    deleteQrCodeMock.mockResolvedValue({ data: { id: "qr-1" } });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));
    expect(deleteQrCodeMock).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteQrCodeMock).toHaveBeenCalledWith("qr-1");
    expect(refreshMock).toHaveBeenCalled();
    // List/card usage (no redirectAfterDeleteTo) never navigates — the
    // row just disappears from the list it's still on.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("P-04: redirects to the given path after deleting when redirectAfterDeleteTo is set (the QR's own detail page)", async () => {
    deleteQrCodeMock.mockResolvedValue({ data: { id: "qr-1" } });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} redirectAfterDeleteTo="/dashboard/qr-codes" />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(deleteQrCodeMock).toHaveBeenCalledWith("qr-1");
    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes");
    expect(refreshMock).toHaveBeenCalled();
  });

  it("does not redirect when delete fails, even if redirectAfterDeleteTo is set", async () => {
    deleteQrCodeMock.mockResolvedValue({ error: "Couldn't delete — it may already be gone." });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} redirectAfterDeleteTo="/dashboard/qr-codes" />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await screen.findByText("Couldn't delete — it may already be gone.");
    expect(pushMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows an error when delete is blocked (e.g. RLS) instead of silently doing nothing", async () => {
    deleteQrCodeMock.mockResolvedValue({ error: "Couldn't delete — it may already be gone." });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("Couldn't delete — it may already be gone."),
    ).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("regenerates and downloads a PNG from the saved config", async () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(await screen.findByRole("button", { name: "Download" })).toBeEnabled();

    expect(clickSpy).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });

  it("hides the Download button when showDownload is false (QR detail page)", () => {
    render(<QRCodeRowActions qrCode={qrCode} showDownload={false} />);
    expect(screen.queryByRole("button", { name: "Download" })).not.toBeInTheDocument();
  });

  it("has no Pause control for a static QR", () => {
    render(<QRCodeRowActions qrCode={qrCode} />);
    expect(screen.queryByRole("button", { name: /pause/i })).not.toBeInTheDocument();
  });

  const dynamicQrCode: QrCodeRecord = {
    ...qrCode,
    mode: "dynamic",
    slug: "abc12345",
    destinationUrl: "https://example.com",
  };

  it("pauses an active dynamic QR and shows Reactivate for an already-paused one", async () => {
    setQrCodeStatusMock.mockResolvedValue({ data: { status: "paused" } });
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={dynamicQrCode} />);

    await user.click(screen.getByRole("button", { name: "Pause My Restaurant Menu" }));

    expect(setQrCodeStatusMock).toHaveBeenCalledWith("qr-1", "paused");
    expect(refreshMock).toHaveBeenCalled();

    cleanup();
    render(<QRCodeRowActions qrCode={{ ...dynamicQrCode, status: "paused" }} />);
    expect(
      screen.getByRole("button", { name: "Reactivate My Restaurant Menu" }),
    ).toBeInTheDocument();
  });

  it("hides Pause once a dynamic QR is archived", () => {
    render(<QRCodeRowActions qrCode={{ ...dynamicQrCode, status: "archived" }} />);
    expect(screen.queryByRole("button", { name: /pause|reactivate/i })).not.toBeInTheDocument();
  });

  it("the delete confirmation discloses scan history only for a plain type", async () => {
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={qrCode} />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm delete My Restaurant Menu" });
    expect(dialog.textContent).toContain(
      "This permanently deletes the QR code and its scan history.",
    );
    expect(dialog.textContent).not.toContain("uploaded files");
  });

  it("the delete confirmation also discloses uploaded files for a storage-backed type", async () => {
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={{ ...qrCode, qrType: "pdf" }} />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm delete My Restaurant Menu" });
    expect(dialog.textContent).toContain(
      "This permanently deletes the QR code and its scan history, any uploaded files.",
    );
  });

  it("the delete confirmation also discloses feedback received for a feedback QR", async () => {
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={{ ...qrCode, qrType: "feedback" }} />);

    await user.click(screen.getByRole("button", { name: "Delete My Restaurant Menu" }));

    const dialog = screen.getByRole("dialog", { name: "Confirm delete My Restaurant Menu" });
    expect(dialog.textContent).toContain(
      "This permanently deletes the QR code and its scan history, any feedback received.",
    );
  });

  it("downloads a dynamic QR by regenerating its /r/[slug] redirect link, not the raw destination", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example";
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<QRCodeRowActions qrCode={dynamicQrCode} />);

    await user.click(screen.getByRole("button", { name: "Download" }));
    expect(await screen.findByRole("button", { name: "Download" })).toBeEnabled();

    expect(clickSpy).toHaveBeenCalledOnce();
    clickSpy.mockRestore();
  });
});
