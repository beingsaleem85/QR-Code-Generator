// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PdfForm } from "@/components/qr/content-forms/PdfForm";
import { uploadQrAsset } from "@/lib/qr/asset-upload";

vi.mock("@/lib/qr/asset-upload", () => ({
  uploadQrAsset: vi.fn(),
  AssetValidationError: class AssetValidationError extends Error {},
}));

afterEach(() => cleanup());

describe("PdfForm — Open PDF directly", () => {
  it("shows the Open PDF directly checkbox", () => {
    render(<PdfForm value={{}} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).toBeInTheDocument();
  });

  it("shows the helper text explaining the behavior", () => {
    render(<PdfForm value={{}} onChange={vi.fn()} />);

    expect(
      screen.getByText(/skip the file page and open this pdf immediately after scanning/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/you can still replace the pdf later without changing your qr code/i),
    ).toBeInTheDocument();
  });

  it("defaults to unchecked when no value is present", () => {
    render(<PdfForm value={{}} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).not.toBeChecked();
  });

  it("defaults to unchecked for an existing record that predates this field", () => {
    render(
      <PdfForm
        value={{ path: "u/a/menu.pdf", fileName: "menu.pdf", sizeBytes: 100 }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).not.toBeChecked();
  });

  it("reflects an explicit openDirectly: true value as checked", () => {
    render(
      <PdfForm
        value={{ path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("checkbox", { name: /open pdf directly/i })).toBeChecked();
  });

  it("calls onChange with openDirectly: true, preserving the rest of the content, when checked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PdfForm value={{ path: "u/a/menu.pdf", fileName: "menu.pdf" }} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: /open pdf directly/i }));

    expect(onChange).toHaveBeenCalledWith({
      path: "u/a/menu.pdf",
      fileName: "menu.pdf",
      openDirectly: true,
    });
  });

  it("calls onChange with openDirectly: false when unchecked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PdfForm
        value={{ path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true }}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole("checkbox", { name: /open pdf directly/i }));

    expect(onChange).toHaveBeenCalledWith({
      path: "u/a/menu.pdf",
      fileName: "menu.pdf",
      openDirectly: false,
    });
  });

  it("preserves openDirectly: true when a replacement file is uploaded", async () => {
    vi.mocked(uploadQrAsset).mockResolvedValue({
      path: "u/a/replacement.pdf",
      fileName: "replacement.pdf",
      sizeBytes: 200,
      mimeType: "application/pdf",
    });
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PdfForm
        value={{ path: "u/a/menu.pdf", fileName: "menu.pdf", openDirectly: true }}
        onChange={onChange}
      />,
    );

    const file = new File(["dummy"], "replacement.pdf", { type: "application/pdf" });
    await user.upload(screen.getByLabelText("PDF file"), file);

    expect(onChange).toHaveBeenCalledWith({
      path: "u/a/replacement.pdf",
      fileName: "replacement.pdf",
      sizeBytes: 200,
      mimeType: "application/pdf",
      openDirectly: true,
    });
  });
});
