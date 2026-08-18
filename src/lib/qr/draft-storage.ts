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
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // sessionStorage unavailable (private browsing, storage full, etc.)
    // — the draft simply won't survive the redirect; not fatal.
  }
}

export function takeDraft(): QrDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DRAFT_KEY);
    return JSON.parse(raw) as QrDraft;
  } catch {
    return null;
  }
}
