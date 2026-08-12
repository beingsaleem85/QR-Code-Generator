import type { z } from "zod";

export type QRMode = "static" | "dynamic";

export type QRType =
  | "url"
  | "text"
  | "email"
  | "phone"
  | "sms"
  | "vcard"
  | "whatsapp"
  | "wifi"
  | "pdf"
  | "app"
  | "images"
  | "video"
  | "social"
  | "event"
  | "barcode_2d"
  | "multi_link"
  | "menu"
  | "feedback"
  | "audio"
  | "location";

export type PreviewUpdateStrategy = "immediate" | "debounced";

/**
 * One entry per QRType. `payloadBuilder` is intentionally erased to a
 * generic `Record<string, unknown> -> string` signature so heterogeneous
 * types can share one registry; call sites that know the concrete type
 * should import the specific builder from `src/lib/qr/payload-builders`
 * instead for full type safety.
 */
export interface QRTypeDefinition {
  key: QRType;
  label: string;
  /** Icon key resolved to a component in the UI phase, not a component itself. */
  icon: string;
  staticSupport: boolean;
  dynamicSupport: boolean;
  fields: z.ZodTypeAny;
  payloadBuilder?: (input: Record<string, unknown>) => string;
  needsStorage: boolean;
  needsLandingPage: boolean;
  supportsAnalytics: boolean;
  previewUpdateStrategy: PreviewUpdateStrategy;
}
