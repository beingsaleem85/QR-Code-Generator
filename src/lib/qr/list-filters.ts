import { qrTypeRegistry } from "@/lib/qr/registry";
import { isQrSortField, type ListQrCodesPageFilters } from "@/lib/qr/queries";
import type { QRMode, QRType } from "@/types/qr";
import type { QRCodeStatus } from "@/types/qr-record";

/** Raw, untyped URL search params for `/dashboard/qr-codes` — every value is `string | undefined`. */
export interface QrListSearchParams {
  q?: string;
  type?: string;
  mode?: string;
  status?: string;
  folder?: string;
  sort?: string;
  dir?: string;
  page?: string;
}

const VALID_TYPES = new Set<string>(Object.keys(qrTypeRegistry));
const VALID_MODES = new Set<QRMode>(["static", "dynamic"]);
const VALID_STATUSES = new Set<QRCodeStatus>(["active", "paused", "archived"]);

/**
 * Turns raw, untrusted URL search params into validated `listQrCodesPage`
 * filters — anything unrecognized is silently dropped (falls back to "no
 * filter on this dimension") rather than thrown, since a malformed/stale
 * URL should degrade gracefully, not error the whole page.
 */
export function parseQrListSearchParams(params: QrListSearchParams): ListQrCodesPageFilters {
  const filters: ListQrCodesPageFilters = {};

  if (params.q?.trim()) filters.search = params.q.trim();
  if (params.type && VALID_TYPES.has(params.type)) filters.qrType = params.type as QRType;
  if (params.mode && VALID_MODES.has(params.mode as QRMode)) filters.mode = params.mode as QRMode;
  if (params.status && VALID_STATUSES.has(params.status as QRCodeStatus)) {
    filters.status = params.status as QRCodeStatus;
  }
  if (params.folder) filters.folderId = params.folder;
  if (params.sort && isQrSortField(params.sort)) filters.sortBy = params.sort;
  if (params.dir === "asc" || params.dir === "desc") filters.sortDirection = params.dir;

  const page = Number(params.page);
  if (Number.isInteger(page) && page > 0) filters.page = page;

  return filters;
}
