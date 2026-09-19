"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { ALLOWED_PAGE_SIZES, DEFAULT_PAGE_SIZE } from "@/lib/qr/list-constants";

interface PaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
  pageSize?: number;
}

function hrefForPage(pathname: string, searchParams: URLSearchParams, targetPage: number): string {
  const next = new URLSearchParams(searchParams.toString());
  if (targetPage <= 1) next.delete("page");
  else next.set("page", String(targetPage));
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function Pagination({
  page,
  pageCount,
  totalCount,
  pageSize = DEFAULT_PAGE_SIZE,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalCount === 0 || (pageCount <= 1 && totalCount <= pageSize && !searchParams.get("pageSize"))) {
    return null;
  }

  const from = Math.min((page - 1) * pageSize + 1, totalCount);
  const to = Math.min(page * pageSize, totalCount);

  const handlePageSizeChange = (newSize: number) => {
    const next = new URLSearchParams(searchParams.toString());
    if (newSize === DEFAULT_PAGE_SIZE) {
      next.delete("pageSize");
    } else {
      next.set("pageSize", String(newSize));
    }
    next.delete("limit");
    next.delete("page"); // Reset to page 1 on page size change
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground"
    >
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Page {page} of {pageCount} &middot; {from}–{to} of {totalCount.toLocaleString()} total
        </span>

        <div className="flex items-center gap-1.5">
          <span className="text-xs">Show:</span>
          <Select
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            aria-label="Page size"
            className="h-8 py-1 text-xs"
          >
            {ALLOWED_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        {page > 1 ? (
          <Link
            href={hrefForPage(pathname, searchParams, page - 1)}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Previous
          </Link>
        ) : (
          <span
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "opacity-50 cursor-not-allowed",
            })}
            aria-disabled="true"
          >
            Previous
          </span>
        )}
        {page < pageCount ? (
          <Link
            href={hrefForPage(pathname, searchParams, page + 1)}
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            Next
          </Link>
        ) : (
          <span
            className={buttonVariants({
              variant: "secondary",
              size: "sm",
              className: "opacity-50 cursor-not-allowed",
            })}
            aria-disabled="true"
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}