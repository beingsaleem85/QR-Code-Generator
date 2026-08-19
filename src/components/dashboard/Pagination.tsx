"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";

interface PaginationProps {
  page: number;
  pageCount: number;
  totalCount: number;
}

function hrefForPage(pathname: string, searchParams: URLSearchParams, page: number): string {
  const next = new URLSearchParams(searchParams.toString());
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** Plain `<Link>`s (not client-side page state) — bookmarkable/shareable, no extra state to manage. */
export function Pagination({ page, pageCount, totalCount }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pageCount <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 text-sm text-muted-foreground"
    >
      <span>
        Page {page} of {pageCount} &middot; {totalCount.toLocaleString()} total
      </span>
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
              className: "opacity-50",
            })}
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
              className: "opacity-50",
            })}
          >
            Next
          </span>
        )}
      </div>
    </nav>
  );
}
