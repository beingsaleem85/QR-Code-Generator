import QRCode from "qrcode";
import { getQrTypeDefinition } from "@/lib/qr/registry";
import type { QRType } from "@/types/qr";
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
 * A minimal, working default filename — lowercase, non-alphanumerics
 * collapsed to single hyphens, trimmed. Full filename-sanitization policy
 * (safe-filename edge cases, uniqueness) is explicitly Module 3.4's scope;
 * this exists only so today's download has *a* sane name instead of none.
 */
export function slugifyForFilename(name: string, fallback = "qr-code"): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}
