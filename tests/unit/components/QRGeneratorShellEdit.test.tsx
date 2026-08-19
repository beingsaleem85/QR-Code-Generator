// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => cleanup());

describe("QRGeneratorShell edit variant (Module 2.7)", () => {
  it("shows no unsaved-changes indicator until something changes", () => {
    render(<QRGeneratorShell variant="edit" initialName="My QR" />);

    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeDisabled();
  });

  it("shows the unsaved-changes indicator and enables Save Changes after an edit", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell variant="edit" initialName="My QR" />);

    await user.type(screen.getByLabelText("QR name"), " updated");

    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("prevents the browser from closing/reloading while dirty", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell variant="edit" initialName="My QR" />);

    await user.type(screen.getByLabelText("QR name"), " updated");

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("does not intercept beforeunload when nothing has changed", () => {
    render(<QRGeneratorShell variant="edit" initialName="My QR" />);

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("Reset restores the initial name and clears the dirty indicator", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell variant="edit" initialName="My QR" />);

    await user.type(screen.getByLabelText("QR name"), " updated");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(screen.getByLabelText("QR name")).toHaveValue("My QR");
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("does not show Save Changes or the unsaved indicator in create mode", () => {
    render(<QRGeneratorShell />);

    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  describe("PDF direct-open setting, edit flow", () => {
    it("loads a saved PDF QR with Open PDF directly checked when the record has openDirectly: true", () => {
      render(
        <QRGeneratorShell
          variant="edit"
          initialName="Menu"
          initialMode="dynamic"
          initialQrType="pdf"
          initialContent={{
            path: "u/a/menu.pdf",
            fileName: "menu.pdf",
            sizeBytes: 100,
            mimeType: "application/pdf",
            openDirectly: true,
          }}
          initialSlug="abc12345"
        />,
      );

      expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).toBeChecked();
    });

    it("loads a saved PDF QR from before this field existed as unchecked", () => {
      render(
        <QRGeneratorShell
          variant="edit"
          initialName="Menu"
          initialMode="dynamic"
          initialQrType="pdf"
          initialContent={{
            path: "u/a/menu.pdf",
            fileName: "menu.pdf",
            sizeBytes: 100,
            mimeType: "application/pdf",
          }}
          initialSlug="abc12345"
        />,
      );

      expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).not.toBeChecked();
    });

    it("toggling Open PDF directly off marks the QR dirty and persists the unchecked state", async () => {
      const user = userEvent.setup();
      render(
        <QRGeneratorShell
          variant="edit"
          initialName="Menu"
          initialMode="dynamic"
          initialQrType="pdf"
          initialContent={{
            path: "u/a/menu.pdf",
            fileName: "menu.pdf",
            sizeBytes: 100,
            mimeType: "application/pdf",
            openDirectly: true,
          }}
          initialSlug="abc12345"
        />,
      );

      const checkbox = screen.getByRole("checkbox", { name: /open pdf directly/i });
      expect(checkbox).toBeChecked();

      await user.click(checkbox);

      expect(checkbox).not.toBeChecked();
      expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    });

    it("keeps the checkbox state after interacting with an unrelated field (persists through builder state)", async () => {
      const user = userEvent.setup();
      render(
        <QRGeneratorShell
          variant="edit"
          initialName="Menu"
          initialMode="dynamic"
          initialQrType="pdf"
          initialContent={{
            path: "u/a/menu.pdf",
            fileName: "menu.pdf",
            sizeBytes: 100,
            mimeType: "application/pdf",
          }}
          initialSlug="abc12345"
        />,
      );

      const checkbox = screen.getByRole("checkbox", { name: /open pdf directly/i });
      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.type(screen.getByLabelText("QR name"), " updated");

      expect(checkbox).toBeChecked();
    });
  });
});
