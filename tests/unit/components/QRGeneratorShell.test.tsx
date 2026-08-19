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

describe("QRGeneratorShell", () => {
  it("renders the URL content form by default", () => {
    render(<QRGeneratorShell />);
    expect(screen.getByText("URL / Link details")).toBeInTheDocument();
  });

  it("switches the content form when a different type is selected", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    await user.click(screen.getByRole("option", { name: "Text" }));

    expect(screen.getByText("Text details")).toBeInTheDocument();
  });

  it("filters the type list when switching to dynamic mode", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    // Static-only and dynamic-only types are now roughly balanced in
    // count (Module 3.9 added several dynamic-only landing-page types),
    // so a plain "fewer options" check is no longer a reliable signal —
    // assert the actual membership change instead: a static-only type
    // (Text) disappears, a dynamic-only type (PDF) appears.
    expect(screen.getByRole("option", { name: "Text" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "PDF" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "dynamic" }));

    expect(screen.queryByRole("option", { name: "Text" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PDF" })).toBeInTheDocument();
  });

  it("clears the name field when Reset is clicked", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    const nameInput = screen.getByLabelText("QR name");
    await user.type(nameInput, "My QR");
    expect(nameInput).toHaveValue("My QR");

    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(nameInput).toHaveValue("");
  });

  it("shows an enabled Save QR button in create mode", () => {
    render(<QRGeneratorShell />);
    expect(screen.getByRole("button", { name: "Save QR" })).toBeEnabled();
  });

  it("validates the URL field and shows an inline error on blur", async () => {
    const user = userEvent.setup();
    render(<QRGeneratorShell />);

    const urlInput = screen.getByLabelText("Destination URL");
    await user.click(urlInput);
    await user.tab();

    expect(await screen.findByText(/enter a url/i)).toBeInTheDocument();
  });
});
