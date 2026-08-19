// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QRTypeSelector } from "@/components/qr/QRTypeSelector";

afterEach(() => cleanup());

describe("QRTypeSelector", () => {
  it("shows dynamic-only implemented types (PDF) while static mode is selected", () => {
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "PDF" })).toBeInTheDocument();
  });

  it("shows every other implemented dynamic-only/hosted type in static mode too", () => {
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={vi.fn()} />);

    for (const label of [
      "Images / Gallery",
      "MP3 / Audio",
      "Social Media",
      "Multiple Links / Link-in-bio",
      "Menu",
      "Feedback",
      "App Store / Play Store",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("marks dynamic-only types with a Dynamic badge in static mode", () => {
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={vi.fn()} />);

    const pdfOption = screen.getByRole("option", { name: "PDF" });
    expect(within(pdfOption).getByText("Dynamic")).toBeInTheDocument();
  });

  it("does not badge a type that natively supports static (URL)", () => {
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={vi.fn()} />);

    const urlOption = screen.getByRole("option", { name: "URL / Link" });
    expect(within(urlOption).queryByText("Dynamic")).not.toBeInTheDocument();
  });

  it("never renders the same QR type as two separate tiles, in either mode", () => {
    for (const mode of ["static", "dynamic"] as const) {
      const { unmount } = render(
        <QRTypeSelector mode={mode} selectedType="url" onTypeChange={vi.fn()} />,
      );
      const options = screen.getAllByRole("option");
      const labels = options.map((option) => option.getAttribute("title"));
      expect(new Set(labels).size).toBe(labels.length);
      unmount();
    }
  });

  it("still hides a not-yet-implemented dynamic-only type the same way it always did", () => {
    // Neither `barcode_2d` nor `location` is dynamic-only (both already
    // have staticSupport: true), so this change doesn't add or remove
    // anything for them — a not-yet-implemented type only ever appears via
    // its own existing staticSupport/dynamicSupport flags, not because it
    // has a content form (it doesn't).
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={vi.fn()} />);
    expect(screen.getByRole("option", { name: "2D Barcode" })).toBeInTheDocument();
  });

  it("calls onTypeChange with the clicked type's key", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    const onTypeChange = vi.fn();
    render(<QRTypeSelector mode="static" selectedType="url" onTypeChange={onTypeChange} />);

    await user.click(screen.getByRole("option", { name: "PDF" }));

    expect(onTypeChange).toHaveBeenCalledWith("pdf");
  });
});
