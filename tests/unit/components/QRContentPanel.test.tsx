// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QRContentPanel } from "@/components/qr/QRContentPanel";

afterEach(() => cleanup());

describe("QRContentPanel", () => {
  it("renders the real content form for an implemented type", () => {
    render(<QRContentPanel qrType="url" value={{}} onChange={vi.fn()} />);
    expect(screen.getByLabelText("Destination URL")).toBeInTheDocument();
  });

  it("never leaks internal file paths or development terminology for a not-yet-implemented type", () => {
    // QRTypeSelector now prevents a real user from ever selecting
    // barcode_2d/location, so this only exercises the defense-in-depth
    // fallback directly.
    render(<QRContentPanel qrType="barcode_2d" value={{}} onChange={vi.fn()} />);

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toMatch(/\.md|architecture|module \d|docs\//i);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
