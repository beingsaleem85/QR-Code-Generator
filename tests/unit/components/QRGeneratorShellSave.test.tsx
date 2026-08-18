// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const saveQrCodeMock = vi.fn();
const updateQrCodeMock = vi.fn();
vi.mock("@/lib/qr/actions", () => ({
  saveQrCode: (...args: unknown[]) => saveQrCodeMock(...args),
  updateQrCode: (...args: unknown[]) => updateQrCodeMock(...args),
}));

afterEach(() => cleanup());

beforeEach(() => {
  pushMock.mockReset();
  refreshMock.mockReset();
  saveQrCodeMock.mockReset();
  updateQrCodeMock.mockReset();
  sessionStorage.clear();
});

describe("QRGeneratorShell save flow (create)", () => {
  it("saves valid content and navigates to the new QR's detail page", async () => {
    saveQrCodeMock.mockResolvedValue({ data: { id: "new-id" } });
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.type(screen.getByLabelText("QR name"), "My QR");
    await user.type(screen.getByLabelText("Destination URL"), "example.com");
    await user.click(screen.getByRole("button", { name: "Save QR" }));

    // On success the component navigates away (via router.push) rather
    // than resetting its own loading state — same pattern as LoginForm.
    await vi.waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(saveQrCodeMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My QR", mode: "static", qrType: "url" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes/new-id");
  });

  it("shows a real error and stays on the page when the save fails validation server-side", async () => {
    saveQrCodeMock.mockResolvedValue({ error: "Fix the content errors above before saving." });
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.click(screen.getByRole("button", { name: "Save QR" }));

    expect(
      await screen.findByText("Fix the content errors above before saving."),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save QR" })).toBeEnabled();
  });

  it("stashes a draft and redirects to login when saving requires authentication", async () => {
    saveQrCodeMock.mockResolvedValue({ error: "AUTH_REQUIRED" });
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.type(screen.getByLabelText("QR name"), "Anon Draft");
    await user.click(screen.getByRole("button", { name: "Save QR" }));

    expect(await vi.waitFor(() => pushMock.mock.calls.length > 0)).toBe(true);
    expect(pushMock).toHaveBeenCalledWith(
      expect.stringContaining("/login?redirectTo=%2Fdashboard%2Fqr-codes%2Fnew"),
    );
    expect(JSON.parse(sessionStorage.getItem("qr-generator-draft") ?? "{}")).toMatchObject({
      name: "Anon Draft",
    });
  });

  it("disables Save QR while a save is in flight, preventing duplicate submissions", async () => {
    let resolveSave: (value: unknown) => void = () => {};
    saveQrCodeMock.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.click(screen.getByRole("button", { name: "Save QR" }));

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(saveQrCodeMock).toHaveBeenCalledTimes(1);

    resolveSave({ data: { id: "x" } });
  });
});

describe("QRGeneratorShell save flow (edit)", () => {
  it("calls updateQrCode with the existing id and navigates on success", async () => {
    updateQrCodeMock.mockResolvedValue({ data: { id: "existing-id" } });
    const user = userEvent.setup();
    render(
      <QRGeneratorShell
        variant="edit"
        qrCodeId="existing-id"
        initialName="Original"
        initialContent={{ url: "https://example.com" }}
      />,
    );

    await user.type(screen.getByLabelText("QR name"), " Updated");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(updateQrCodeMock).toHaveBeenCalledWith(
      "existing-id",
      expect.objectContaining({ name: "Original Updated" }),
    );
    expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes/existing-id");
  });
});
