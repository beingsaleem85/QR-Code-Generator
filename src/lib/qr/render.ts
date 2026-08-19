import QRCode from "qrcode";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import { buildLandingPageUrl, buildPublicViewerUrl, buildRedirectUrl } from "@/lib/qr/redirect-url";
import type { QRMode, QRType } from "@/types/qr";
import type { DesignConfig } from "@/types/qr-design";

/**
 * Validates `content` against the QR type's own Zod schema (the single
 * source of truth from Module 1.3) and, only if valid, builds the encoded
 * payload string via the registry's payload builder. Returns `null` for
 * incomplete/invalid content rather than throwing — callers (preview,
 * download) treat `null` as "nothing to render yet", not an error.
 */
export function buildQrPayload(qrType: QRType, content: Record<string, unknown>): string | null {
  const definition = getQrTypeDefinition(qrType);
  if (!definition.payloadBuilder) return null;

  const parsed = definition.fields.safeParse(content);
  if (!parsed.success) return null;

  return definition.payloadBuilder(parsed.data as Record<string, unknown>);
}

/**
 * What actually gets encoded into the QR image, mode-and-type-aware
 * (Module 3.6, extended Module 3.8). A static QR always encodes its
 * content directly. A dynamic QR always encodes one of this app's own
 * URLs instead — never the raw content — so the destination/experience can
 * change later without reprinting the code: `/p/[slug]` for types that
 * need a hosted landing page (`needsLandingPage: true` — pdf, image
 * gallery, audio, video), `/r/[slug]` for everything else (a plain
 * redirect). `slug` is `null`/`undefined` only in the brief window between
 * starting a new dynamic QR and its first save (no slug has been issued
 * yet); callers treat that as "nothing to render yet", same as invalid
 * content.
 *
 * `publicToken` takes priority over `slug` for a PDF QR specifically —
 * `/v/[token]` instead of `/p/[slug]`, so nothing about the printed code
 * (filename, database id, ownership) is inferable from it. Only ever set
 * for a PDF QR that had "Open PDF directly" on at creation time, and
 * — like `slug` — is fixed for the life of the record once issued; gated
 * on `qrType === "pdf"` here so a QR whose type later changes away from
 * "pdf" via edit falls back to its ordinary slug-based URL instead of
 * pointing at a viewer route that would no longer resolve it.
 */
export function resolveEncodedPayload(
  mode: QRMode,
  qrType: QRType,
  content: Record<string, unknown>,
  slug?: string | null,
  publicToken?: string | null,
): string | null {
  if (mode === "dynamic") {
    if (publicToken && qrType === "pdf") return buildPublicViewerUrl(publicToken);
    if (!slug) return null;
    return getQrTypeDefinition(qrType).needsLandingPage
      ? buildLandingPageUrl(slug)
      : buildRedirectUrl(slug);
  }
  return buildQrPayload(qrType, content);
}

/**
 * Only the two solid colors from `DesignConfig` are honored here — dot/eye
 * shape, gradients, frames, and logo overlay need a custom SVG-matrix
 * renderer and are Module 3.3's job ("QR Styling and Live Preview Engine").
 * Wiring just these two now (rather than none) means the existing color
 * pickers do something real instead of being another inert control.
 */
function toQrColorOption(design: DesignConfig): { dark: string; light: string } {
  const { foreground, background, transparentBackground } = design.colors;
  return {
    dark: foreground,
    light: transparentBackground ? `${background}00` : background,
  };
}

export async function renderQrSvg(payload: string, design: DesignConfig): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    margin: 1,
    color: toQrColorOption(design),
  });
}

export async function renderQrPngDataUrl(
  payload: string,
  design: DesignConfig,
  width = 512,
): Promise<string> {
  return QRCode.toDataURL(payload, {
    type: "image/png",
    margin: 1,
    width,
    color: toQrColorOption(design),
  });
}

/**
 * Full filename-sanitization policy (Module 3.4): Unicode-normalizes and
 * strips diacritical marks first (so "Café" contributes "cafe", not
 * nothing), then lowercases, collapses any run of non [a-z0-9] characters
 * (including untransliterable scripts like CJK, which have no ASCII
 * equivalent to fall back to) to a single hyphen, trims the edges, and
 * caps length.
 *
 * Windows-reserved device names (CON, NUL, COM1, ...) are deliberately
 * NOT special-cased here: every call site appends a suffix before the
 * extension (`${filename}-qr.png`), so the actual on-disk name this
 * produces can never collide with a bare reserved name — adding a check
 * for a case that structurally can't occur would just be dead validation.
 */
const MAX_FILENAME_LENGTH = 60;

export function slugifyForFilename(name: string, fallback = "qr-code"): string {
  // \p{M} matches any Unicode combining-mark character — this is what
  // NFKD splits an accented letter into (e.g. "e" + a combining acute).
  const withoutDiacritics = name.normalize("NFKD").replace(/\p{M}/gu, "");

  const slug = withoutDiacritics
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(/-+$/g, "");

  return slug || fallback;
}
