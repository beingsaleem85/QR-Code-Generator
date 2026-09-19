// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QRDesignGallery } from "@/components/qr/QRDesignGallery";
import { DEFAULT_DESIGN_CONFIG } from "@/types/qr-design";

afterEach(() => cleanup());

describe("QRDesignGallery", () => {
  it("renders the design preset radio group with options", async () => {
    render(<QRDesignGallery value={DEFAULT_DESIGN_CONFIG} onChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "QR design preset" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Classic/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Fine Dots/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Modern/i })).toBeInTheDocument();
  });

  it("calls onChange with the preset design properties when a preset is clicked", async () => {
    const onChange = vi.fn();
    render(<QRDesignGallery value={DEFAULT_DESIGN_CONFIG} onChange={onChange} />);

    const fineDotsButton = screen.getByRole("radio", { name: /Fine Dots/i });
    fireEvent.click(fineDotsButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const updatedConfig = onChange.mock.calls[0][0];
    expect(updatedConfig.pattern.dotStyle).toBe("fine-dots");
    expect(updatedConfig.colors.foreground).toBe("#000000");
  });
});
