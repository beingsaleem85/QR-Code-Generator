// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { InactiveQrCard } from "@/components/landing/InactiveQrCard";

afterEach(() => {
  cleanup();
});

describe("InactiveQrCard", () => {
  it("renders the exact branded inactive message without leaking private account data", () => {
    render(<InactiveQrCard />);

    expect(screen.getByText("This QR code is currently inactive.")).toBeInTheDocument();
    expect(
      screen.getByText("The QR code owner needs to reactivate their QRForge account."),
    ).toBeInTheDocument();

    // Ensure no owner email or ID elements are rendered
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
