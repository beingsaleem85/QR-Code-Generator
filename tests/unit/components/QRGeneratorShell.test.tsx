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

    // A static-only type (Text) is only ever offered in static mode.
    // PDF (dynamic-only) is discoverable in both modes now — see the
    // "dynamic-only type discoverability" describe block below — so the
    // membership change that actually distinguishes the two modes is on
    // the static-only side.
    expect(screen.getByRole("option", { name: "Text" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "dynamic" }));

    expect(screen.queryByRole("option", { name: "Text" })).not.toBeInTheDocument();
    expect(screen.getByRole("option", { name: "PDF" })).toBeInTheDocument();
  });

  describe("dynamic-only type discoverability (PDF and friends stay visible in static mode)", () => {
    it("shows PDF in the type selector while Static mode is currently selected", () => {
      render(<QRGeneratorShell />);

      expect(screen.getByRole("tab", { name: "static", selected: true })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "PDF" })).toBeInTheDocument();
    });

    it("clicking PDF while Static is selected switches the builder to Dynamic mode", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("option", { name: "PDF" }));

      expect(screen.getByRole("tab", { name: "dynamic", selected: true })).toBeInTheDocument();
    });

    it("selects PDF as the active QR type after the auto-switch", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("option", { name: "PDF" }));

      expect(screen.getByRole("option", { name: "PDF" })).toHaveAttribute("aria-selected", "true");
    });

    it("renders the existing PDF upload UI once selected", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("option", { name: "PDF" }));

      expect(screen.getByLabelText("PDF file")).toBeInTheDocument();
    });

    it("shows an explanatory message that PDF uses Dynamic mode", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("option", { name: "PDF" }));

      expect(
        screen.getByText(/PDF QR codes use Dynamic mode so you can replace the PDF later/i),
      ).toBeInTheDocument();
    });

    it("does not show the Dynamic-mode explanatory message for a static type", () => {
      render(<QRGeneratorShell />);

      expect(screen.queryByText(/use Dynamic mode/i)).not.toBeInTheDocument();
    });

    it("does not auto-switch mode when PDF is clicked while already in Dynamic mode", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("tab", { name: "dynamic" }));
      await user.click(screen.getByRole("option", { name: "PDF" }));

      expect(screen.getByRole("tab", { name: "dynamic", selected: true })).toBeInTheDocument();
      expect(screen.getByLabelText("PDF file")).toBeInTheDocument();
    });

    it("switching to a static-only type after PDF still works normally (no auto-switch)", async () => {
      const user = userEvent.setup();
      render(<QRGeneratorShell />);

      await user.click(screen.getByRole("option", { name: "PDF" }));
      expect(screen.getByRole("tab", { name: "dynamic", selected: true })).toBeInTheDocument();

      await user.click(screen.getByRole("tab", { name: "static" }));
      await user.click(screen.getByRole("option", { name: "Text" }));

      expect(screen.getByRole("tab", { name: "static", selected: true })).toBeInTheDocument();
      expect(screen.getByText("Text details")).toBeInTheDocument();
    });

    it("a plain static type (URL) still saves normally after this change", () => {
      render(<QRGeneratorShell />);

      expect(screen.getByRole("tab", { name: "static", selected: true })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "URL / Link" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      expect(screen.getByRole("button", { name: "Save QR" })).toBeEnabled();
    });
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
