// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import {
  getUserScopedLogoCache,
  setUserScopedLogoCache,
  clearUserScopedLogoCache,
  BUILTIN_LOGOS,
  type LogoItem,
} from "@/lib/qr/logo-library";

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
});

describe("Account-scoped logo gallery", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("provides brand-neutral built-in logos", () => {
    expect(BUILTIN_LOGOS.length).toBeGreaterThanOrEqual(6);
    expect(BUILTIN_LOGOS.map((l) => l.name)).toContain("Web Link");
    expect(BUILTIN_LOGOS.map((l) => l.name)).toContain("Location");
  });

  it("partitions user logos strictly by user ID", () => {
    const userALogos: LogoItem[] = [
      { id: "logo-a1", name: "Logo A", dataUrl: "data:image/svg+xml;utf8,<svg>A</svg>", isCustom: true },
    ];
    const userBLogos: LogoItem[] = [
      { id: "logo-b1", name: "Logo B", dataUrl: "data:image/svg+xml;utf8,<svg>B</svg>", isCustom: true },
    ];

    setUserScopedLogoCache("user-alice-123", userALogos);
    setUserScopedLogoCache("user-bob-456", userBLogos);

    const aliceLoaded = getUserScopedLogoCache("user-alice-123");
    expect(aliceLoaded).toHaveLength(1);
    expect(aliceLoaded[0].name).toBe("Logo A");

    const bobLoaded = getUserScopedLogoCache("user-bob-456");
    expect(bobLoaded).toHaveLength(1);
    expect(bobLoaded[0].name).toBe("Logo B");

    // Cross-user access returns empty
    const eveLoaded = getUserScopedLogoCache("user-eve-789");
    expect(eveLoaded).toHaveLength(0);

    // Unauthenticated access returns empty
    const anonLoaded = getUserScopedLogoCache(null);
    expect(anonLoaded).toHaveLength(0);
  });

  it("preserves legacy unpartitioned localStorage key without automatic deletion", async () => {
    window.localStorage.setItem(
      "qrforge_saved_user_logos",
      JSON.stringify([{ id: "legacy", name: "My Saved Logo", dataUrl: "data:image/png;base64,123" }]),
    );

    // Calling getUserScopedLogoCache must NOT delete the legacy key
    const loaded = getUserScopedLogoCache("user-123");
    expect(loaded).toHaveLength(0);
    expect(window.localStorage.getItem("qrforge_saved_user_logos")).not.toBeNull();

    // getLegacyUnpartitionedLogos reads the data safely
    const { getLegacyUnpartitionedLogos, clearLegacyUnpartitionedLogos } = await import(
      "@/lib/qr/logo-library"
    );
    const legacy = getLegacyUnpartitionedLogos();
    expect(legacy).toHaveLength(1);
    expect(legacy[0].name).toBe("My Saved Logo");

    // Only explicit clear removes the key
    clearLegacyUnpartitionedLogos();
    expect(getLegacyUnpartitionedLogos()).toHaveLength(0);
    expect(window.localStorage.getItem("qrforge_saved_user_logos")).toBeNull();
  });

  it("clears user cache upon sign-out", () => {
    setUserScopedLogoCache("user-123", [
      { id: "1", name: "Test", dataUrl: "data:...", isCustom: true },
    ]);
    expect(getUserScopedLogoCache("user-123")).toHaveLength(1);

    clearUserScopedLogoCache("user-123");
    expect(getUserScopedLogoCache("user-123")).toHaveLength(0);
  });
});
