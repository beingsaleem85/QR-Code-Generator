// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const getMyProfile = vi.fn();
const getMyEntitlement = vi.fn();
const countDynamicQrCodes = vi.fn();

vi.mock("@/lib/account/profile", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/account/profile")>("@/lib/account/profile");
  return { ...actual, getMyProfile };
});
vi.mock("@/lib/account/entitlements", async () => {
  const actual = await vi.importActual<typeof import("@/lib/account/entitlements")>(
    "@/lib/account/entitlements",
  );
  return { ...actual, getMyEntitlement };
});
vi.mock("@/lib/qr/queries", () => ({ countDynamicQrCodes }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const FREE_ENTITLEMENT = { plan: "free", isLifetime: false, expiresAt: null, dynamicQrLimit: null };

describe("AccountPage", () => {
  it("renders the real authenticated user's email and display name", async () => {
    getMyProfile.mockResolvedValue({
      email: "jordan.rivera@example.com",
      displayName: "Jordan Rivera",
      avatarUrl: null,
    });
    getMyEntitlement.mockResolvedValue(FREE_ENTITLEMENT);
    countDynamicQrCodes.mockResolvedValue(0);
    const { default: AccountPage } = await import("@/app/(dashboard)/dashboard/account/page");

    const result = await AccountPage();
    render(result);

    expect(screen.getAllByText("jordan.rivera@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Jordan Rivera").length).toBeGreaterThan(0);
  });

  it("never renders the Ada Lovelace / ada@example.com placeholder", async () => {
    getMyProfile.mockResolvedValue({
      email: "real.person@example.com",
      displayName: "Real Person",
      avatarUrl: null,
    });
    getMyEntitlement.mockResolvedValue(FREE_ENTITLEMENT);
    countDynamicQrCodes.mockResolvedValue(0);
    const { default: AccountPage } = await import("@/app/(dashboard)/dashboard/account/page");

    const result = await AccountPage();
    render(result);

    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
    expect(screen.queryByText("ada@example.com")).not.toBeInTheDocument();
  });

  it("never mentions Module 3.1 or other internal milestone language", async () => {
    getMyProfile.mockResolvedValue({
      email: "real.person@example.com",
      displayName: "Real Person",
      avatarUrl: null,
    });
    getMyEntitlement.mockResolvedValue(FREE_ENTITLEMENT);
    countDynamicQrCodes.mockResolvedValue(0);
    const { default: AccountPage } = await import("@/app/(dashboard)/dashboard/account/page");

    const result = await AccountPage();
    render(result);

    expect(screen.queryByText(/module 3\.1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/not connected to a backend/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/once your account is connected to supabase auth/i),
    ).not.toBeInTheDocument();
  });

  it("derives avatar initials from the real display name", async () => {
    getMyProfile.mockResolvedValue({
      email: "muhammad.saleem@example.com",
      displayName: "Muhammad Saleem",
      avatarUrl: null,
    });
    getMyEntitlement.mockResolvedValue(FREE_ENTITLEMENT);
    countDynamicQrCodes.mockResolvedValue(0);
    const { default: AccountPage } = await import("@/app/(dashboard)/dashboard/account/page");

    const result = await AccountPage();
    render(result);

    expect(screen.getByText("MS")).toBeInTheDocument();
  });

  it("falls back to the email local-part (never a hardcoded name) when no display name is set", async () => {
    getMyProfile.mockResolvedValue({
      email: "freshuser@example.com",
      displayName: null,
      avatarUrl: null,
    });
    getMyEntitlement.mockResolvedValue(FREE_ENTITLEMENT);
    countDynamicQrCodes.mockResolvedValue(0);
    const { default: AccountPage } = await import("@/app/(dashboard)/dashboard/account/page");

    const result = await AccountPage();
    render(result);

    expect(screen.getAllByText("freshuser").length).toBeGreaterThan(0);
  });
});
