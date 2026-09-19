/**
 * Built-in safe brand icons and reusable logo utilities for the Logo Gallery (Requirement C).
 * All built-in icons are self-contained SVG data URLs, ensuring they render
 * identically across previews, SVG exports, and PNG exports without CORS or network dependencies.
 */

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export interface LogoItem {
  id: string;
  name: string;
  dataUrl: string;
  isCustom?: boolean;
}

export const BUILTIN_LOGOS: LogoItem[] = [
  {
    id: "builtin-link",
    name: "Web Link",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0F766E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
    ),
  },
  {
    id: "builtin-location",
    name: "Location",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E11D48" stroke="#E11D48" stroke-width="1.5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`
    ),
  },
  {
    id: "builtin-mail",
    name: "Email",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#D97706" stroke="#ffffff" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2" fill="#F59E0B"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" stroke="#ffffff" stroke-width="2"/></svg>`
    ),
  },
  {
    id: "builtin-phone",
    name: "Phone",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#16A34A" stroke="#ffffff" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="10" fill="#16A34A"/><path d="M16.5 14.5c-.7 0-1.4-.1-2-.4-.3-.1-.6 0-.8.2l-1.3 1.3c-1.8-1-3-2.2-4-4l1.3-1.3c.2-.2.3-.5.2-.8-.3-.6-.4-1.3-.4-2 0-.6-.4-1-1-1H7c-.6 0-1 .4-1 1 0 5.8 4.7 10.5 10.5 10.5.6 0 1-.4 1-1v-1.5c0-.6-.4-1-1-1z" fill="#ffffff"/></svg>`
    ),
  },
  {
    id: "builtin-wifi",
    name: "Wi-Fi",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>`
    ),
  },
  {
    id: "builtin-card",
    name: "Contact Card",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 8h2"/><path d="M15 12h2"/><path d="M7 16h10"/></svg>`
    ),
  },
  {
    id: "builtin-star",
    name: "Star / Review",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B" stroke="#D97706" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
    ),
  },
  {
    id: "builtin-globe",
    name: "Website",
    dataUrl: svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
    ),
  },
];

const MAX_SAVED_LOGOS = 12;

function userCacheKey(userId?: string | null): string | null {
  if (!userId) return null;
  return `qrforge_user_logos_${userId}`;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    if (typeof window.localStorage !== "undefined" && typeof window.localStorage.getItem === "function") {
      return window.localStorage;
    }
    return null;
  } catch {
    return null;
  }
}

export const LEGACY_LOGOS_STORAGE_KEY = "qrforge_saved_user_logos";

/**
 * Purely read-only retrieval of unpartitioned legacy logos stored in the
 * browser from v3. Does NOT delete, modify, or auto-assign them.
 */
export function getLegacyUnpartitionedLogos(): LogoItem[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(LEGACY_LOGOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LogoItem[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item.dataUrl === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Explicit user-confirmed deletion of the legacy local browser copy.
 * Never called automatically.
 */
export function clearLegacyUnpartitionedLogos(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(LEGACY_LOGOS_STORAGE_KEY);
  } catch {
    // Resilient
  }
}

export function getUserScopedLogoCache(userId?: string | null): LogoItem[] {
  const storage = getStorage();
  if (!storage || !userId) return [];
  try {
    const key = userCacheKey(userId);
    if (!key) return [];
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LogoItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setUserScopedLogoCache(userId: string, logos: LogoItem[]): void {
  const storage = getStorage();
  if (!storage || !userId) return;
  try {
    const key = userCacheKey(userId);
    if (!key) return;
    storage.setItem(key, JSON.stringify(logos.slice(0, MAX_SAVED_LOGOS)));
  } catch {
    // Resilient
  }
}

export function clearUserScopedLogoCache(userId?: string | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (userId) {
      const key = userCacheKey(userId);
      if (key) storage.removeItem(key);
    }
  } catch {
    // Resilient
  }
}
