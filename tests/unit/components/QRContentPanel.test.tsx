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
    // Tests defense-in-depth fallback directly for unconfigured/future types.
    render(<QRContentPanel qrType={"future_type" as unknown as import("@/types/qr").QRType} value={{}} onChange={vi.fn()} />);

    const bodyText = document.body.textContent ?? "";
    expect(bodyText).not.toMatch(/\.md|architecture|module \d|docs\//i);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });
});
