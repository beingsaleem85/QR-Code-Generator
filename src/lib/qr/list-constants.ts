import type { QRMode, QRType } from "@/types/qr";
import type { QRCodeStatus } from "@/types/qr-record";
import type { QrCodeRecord } from "@/lib/qr/records";

export type QrSortField = "updated_at" | "created_at" | "name" | "scan_count_cached";
export type SortDirection = "asc" | "desc";

export const SORT_FIELDS: readonly QrSortField[] = [
  "updated_at",
  "created_at",
  "name",
  "scan_count_cached",
];

export function isQrSortField(value: string): value is QrSortField {
  return (SORT_FIELDS as readonly string[]).includes(value);
}

export interface ListQrCodesPageFilters {
  search?: string;
  qrType?: QRType;
  mode?: QRMode;
  /** Omitted = every non-archived status (the default dashboard view). */
  status?: QRCodeStatus;
  /** `"unfiled"` = codes with no folder assigned; omitted = every folder. */
  folderId?: string | "unfiled";
  sortBy?: QrSortField;
  sortDirection?: SortDirection;
  /** 1-indexed. */
  page?: number;
  pageSize?: number;
}

export interface QrCodesPage {
  items: QrCodeRecord[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export const DEFAULT_PAGE_SIZE = 10;
export const ALLOWED_PAGE_SIZES = [10, 25, 50, 100] as const;
export type AllowedPageSize = (typeof ALLOWED_PAGE_SIZES)[number];
