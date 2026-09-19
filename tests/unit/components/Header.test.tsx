// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Header } from "@/components/layout/Header";

const getUser = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser },
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("Header", () => {
  it("renders 'Log in' linking to /login when unauthenticated", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const element = await Header();
    render(element);

    const loginLinks = screen.getAllByRole("link", { name: "Log in" });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute("href", "/login");
  });

  it("renders 'Dashboard' linking to /dashboard when authenticated", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-123", email: "user@example.com" } } });
    const element = await Header();
    render(element);

    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });
    expect(dashboardLinks.length).toBeGreaterThan(0);
    expect(dashboardLinks[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
  });
});
