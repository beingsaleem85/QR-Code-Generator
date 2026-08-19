import type { QRCodeStatus, QRCodeSummary } from "@/types/qr-record";
import type { DesignConfig } from "@/types/qr-design";
import type { QRMode, QRType } from "@/types/qr";

/**
 * Raw `qr_codes` row shape (snake_case, as returned by supabase-js).
 * Never exported past this module's mapping functions — every other file
 * works with `QrCodeRecord` (camelCase, app-layer) instead.
 */
export interface QrCodeDbRow {
  id: string;
  user_id: string;
  folder_id: string | null;
  name: string;
  slug: string | null;
  mode: string;
  qr_type: string;
  status: string;
  payload_data: Record<string, unknown>;
  destination_url: string | null;
  design_config: Record<string, unknown>;
  scan_count_cached: number;
  created_at: string;
  updated_at: string;
}

/**
 * Full app-layer shape of a saved QR code — everything `QRCodeSummary`
 * deliberately omits (`payloadData`/`designConfig`), needed anywhere a QR
 * gets re-rendered or re-edited (detail page, edit page, list-row quick
 * actions). Never includes `user_id` — ownership is enforced by RLS, not
 * carried around in app code that could accidentally leak it client-side.
 */
export interface QrCodeRecord {
  id: string;
  name: string;
  slug: string | null;
  mode: QRMode;
  qrType: QRType;
  status: QRCodeStatus;
  payloadData: Record<string, unknown>;
  designConfig: DesignConfig;
  destinationUrl: string | null;
  folderId: string | null;
  scanCount: number;
  createdAt: string;
  updatedAt: string;
}

export function toQrCodeRecord(row: QrCodeDbRow): QrCodeRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    mode: row.mode as QRMode,
    qrType: row.qr_type as QRType,
    status: row.status as QRCodeStatus,
    payloadData: row.payload_data,
    designConfig: row.design_config as unknown as DesignConfig,
    destinationUrl: row.destination_url,
    folderId: row.folder_id,
    scanCount: row.scan_count_cached,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function truncate(text: string, max = 80): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * A short, human-readable summary of a QR's destination/content for list
 * and detail views. Derived directly from the saved `payload_data` fields
 * (not the fully-built encoded payload — a raw vCard/WIFI-string isn't
 * fit for display) using the same field names each type's content form
 * and Zod schema (Module 1.3) already use.
 */
export function deriveDestinationSummary(
  qrType: QRType,
  payloadData: Record<string, unknown>,
): string {
  switch (qrType) {
    case "url":
      return asString(payloadData.url) || "—";
    case "text":
      return truncate(asString(payloadData.text)) || "—";
    case "email":
      return asString(payloadData.to) || "—";
    case "phone":
      return asString(payloadData.phone) || "—";
    case "sms":
    case "whatsapp":
      return asString(payloadData.phone) || "—";
    case "wifi": {
      const ssid = asString(payloadData.ssid);
      return ssid ? `Network: ${ssid}` : "—";
    }
    case "vcard": {
      const name = [asString(payloadData.firstName), asString(payloadData.lastName)]
        .filter(Boolean)
        .join(" ");
      const company = asString(payloadData.company);
      return [name, company].filter(Boolean).join(", ") || "—";
    }
    case "event":
      return asString(payloadData.title) || "—";
    default:
      return "—";
  }
}

export function toQrCodeSummary(record: QrCodeRecord): QRCodeSummary {
  return {
    id: record.id,
    name: record.name,
    qrType: record.qrType,
    mode: record.mode,
    status: record.status,
    scanCount: record.scanCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    destinationSummary: deriveDestinationSummary(record.qrType, record.payloadData),
  };
}
