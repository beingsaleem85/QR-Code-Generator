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
});
