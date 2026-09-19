// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DesignLogoControls } from "@/components/qr/design-controls";

const { getUserMock } = vi.hoisted(() => ({
  getUserMock: vi.fn().mockResolvedValue({ data: { user: null } }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [] }),
          }),
        }),
      }),
    }),
  })),
}));

const storageMap = new Map<string, string>();
const storageMock = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => {
    storageMap.set(k, String(v));
  },
  removeItem: (k: string) => {
    storageMap.delete(k);
  },
  clear: () => {
    storageMap.clear();
  },
};
Object.defineProperty(window, "localStorage", {
  value: storageMock,
  writable: true,
  configurable: true,
});

afterEach(() => {
  cleanup();
  storageMap.clear();
});

describe("DesignLogoControls", () => {
  it("renders the Logo Library and selecting a built-in logo sets assetUrl", () => {
    const onChange = vi.fn();
    const initialLogo = { assetUrl: null, sizeRatio: 0.2, whiteMargin: true };

    render(<DesignLogoControls value={initialLogo} onChange={onChange} />);

    expect(screen.getByRole("radiogroup", { name: "Logo selection" })).toBeInTheDocument();
    const webLinkBtn = screen.getByRole("radio", { name: "Web Link" });
    fireEvent.click(webLinkBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].assetUrl).toContain("data:image/svg+xml");
  });

  it("clicking the clear button sets assetUrl to null", () => {
    const onChange = vi.fn();
    const initialLogo = {
      assetUrl: "data:image/png;base64,sample",
      sizeRatio: 0.2,
      whiteMargin: true,
    };

    render(<DesignLogoControls value={initialLogo} onChange={onChange} />);

    const noLogoBtn = screen.getByRole("radio", { name: "No logo" });
    fireEvent.click(noLogoBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].assetUrl).toBeNull();
  });

  it("detects and presents recovery banner when unpartitioned legacy logos exist for logged-in user", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://mock.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "mock-key";

    const { LEGACY_LOGOS_STORAGE_KEY } = await import("@/lib/qr/logo-library");
    window.localStorage.setItem(
      LEGACY_LOGOS_STORAGE_KEY,
      JSON.stringify([{ id: "old-1", name: "Old Custom Logo", dataUrl: "data:image/png;base64,123" }]),
    );

    getUserMock.mockResolvedValueOnce({ data: { user: { id: "user-test-456" } } });

    const onChange = vi.fn();
    render(<DesignLogoControls value={{ assetUrl: null, sizeRatio: 0.2, whiteMargin: true }} onChange={onChange} />);

    expect(await screen.findByText(/Found 1 saved logo on this device/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Import to my account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Keep on device/i })).toBeInTheDocument();

    // Clicking "Keep on device" dismisses banner without deleting local copy
    fireEvent.click(screen.getByRole("button", { name: /Keep on device/i }));
    expect(screen.queryByText(/Found 1 saved logo on this device/i)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(LEGACY_LOGOS_STORAGE_KEY)).not.toBeNull();
  });
});
