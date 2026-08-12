// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

afterEach(() => cleanup());

describe("DashboardSidebar", () => {
  it("marks the Overview link current when on /dashboard", async () => {
    usePathname.mockReturnValue("/dashboard");
    const { DashboardSidebar } = await import("@/components/dashboard/DashboardSidebar");

    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "QR Codes" })).not.toHaveAttribute("aria-current");
  });

  it("marks the QR Codes link current on a QR detail route, not a sibling nav item", async () => {
    usePathname.mockReturnValue("/dashboard/qr-codes/abc123");
    const { DashboardSidebar } = await import("@/components/dashboard/DashboardSidebar");

    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "QR Codes" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Create QR" })).not.toHaveAttribute("aria-current");
  });

  it("marks only Create QR current on the new-QR route, not the QR Codes list item too", async () => {
    usePathname.mockReturnValue("/dashboard/qr-codes/new");
    const { DashboardSidebar } = await import("@/components/dashboard/DashboardSidebar");

    render(<DashboardSidebar />);

    expect(screen.getByRole("link", { name: "Create QR" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "QR Codes" })).not.toHaveAttribute("aria-current");
  });
});
