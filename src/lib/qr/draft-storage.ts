import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

/**
 * Preserves generator state across the auth round-trip when an
 * unauthenticated visitor on the public `/qr-generator` page tries to
 * save. sessionStorage (not localStorage) deliberately — a draft should
 * only survive the current tab's login flow, not linger indefinitely.
 */
const DRAFT_KEY = "qr-generator-draft";

export interface QrDraft {
  name: string;
  mode: QRMode;
  qrType: QRType;
  content: Record<string, unknown>;
  design: DesignConfig;
}

export function stashDraft(draft: QrDraft): void {
  try {
    // Ensure only safe builder data is stored; strip any auth or private tokens
    const safeContent: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(draft.content || {})) {
      // Exclude raw File objects, large blobs, or potential sensitive keys
      if (
        key === "password" ||
        key === "token" ||
        key === "secret" ||
        key === "apiKey"
      ) {
        continue;
      }
      if (typeof value === "string" && value.length > 500_000) {
        // Truncate excessively large strings to protect sessionStorage limits
        continue;
      }
      safeContent[key] = value;
    }

    const safeDraft: QrDraft = {
      name: draft.name,
      mode: draft.mode,
      qrType: draft.qrType,
      content: safeContent,
      design: draft.design,
    };

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
  } catch {
    // sessionStorage unavailable (private browsing, storage full, etc.)
    // — the draft simply won't survive the redirect; not fatal.
  }
}

export function peekDraft(): QrDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QrDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function takeDraft(): QrDraft | null {
  const draft = peekDraft();
  if (draft) {
    clearDraft();
  }
  return draft;
}
