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

/**
 * Covers the two owner-approved UX fixes: the Design section must be
 * clearly labeled/discoverable (previously five unlabeled accordion rows
 * under the content form, easy to miss), and the primary Save action must
 * sit at the bottom of the workflow, after content + design, rather than
 * requiring the user to scroll back to the top header to save.
 */
describe("QRGeneratorShell layout — design discoverability + bottom Save", () => {
  it("shows a clear, labeled 'Design your QR' section", () => {
    render(<QRGeneratorShell />);
    expect(screen.getByRole("heading", { name: "Design your QR" })).toBeInTheDocument();
  });

  it("places the only Save QR button after the design section, not in the top header", () => {
    render(<QRGeneratorShell />);

    const designHeading = screen.getByRole("heading", { name: "Design your QR" });
    const saveButtons = screen.getAllByRole("button", { name: "Save QR" });

    // Exactly one Save button exists — no confusing top+bottom duplicate.
    expect(saveButtons).toHaveLength(1);

    const position = designHeading.compareDocumentPosition(saveButtons[0]);
    // DOCUMENT_POSITION_FOLLOWING (4): the save button comes after the
    // design heading in document order, i.e. it's below it on the page.
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("the top header only has Reset, not Save", () => {
    render(<QRGeneratorShell />);
    const heading = screen.getByRole("heading", { name: "Create a QR Code" });
    const header = heading.closest("div")!.parentElement!;
    expect(header.textContent).not.toContain("Save QR");
    expect(header.textContent).toContain("Reset");
  });

  it("the bottom Save button still performs a real save, with a loading state and duplicate-click protection", async () => {
    let resolveSave: (value: unknown) => void = () => {};
    saveQrCodeMock.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.type(screen.getByLabelText("QR name"), "Bottom Save QR");
    await user.type(screen.getByLabelText("Destination URL"), "example.com");

    const saveButton = screen.getByRole("button", { name: "Save QR" });
    await user.click(saveButton);
    await user.click(saveButton); // second click while in-flight — must not double-submit

    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(saveQrCodeMock).toHaveBeenCalledTimes(1);

    resolveSave({ data: { id: "bottom-save-id" } });
    await vi.waitFor(() =>
      expect(pushMock).toHaveBeenCalledWith("/dashboard/qr-codes/bottom-save-id"),
    );
  });

  it("edit variant: 'Save Changes' also sits after the design section", () => {
    render(
      <QRGeneratorShell
        variant="edit"
        qrCodeId="existing-id"
        initialName="Original"
        initialContent={{ url: "https://example.com" }}
      />,
    );

    const designHeading = screen.getByRole("heading", { name: "Design your QR" });
    const saveButton = screen.getByRole("button", { name: "Save Changes" });
    const position = designHeading.compareDocumentPosition(saveButton);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
