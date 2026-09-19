import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { QRCodeListContainer } from "@/components/dashboard/QRCodeListContainer";
import { QRCodesFilterBar } from "@/components/dashboard/QRCodesFilterBar";
import { FolderManager } from "@/components/dashboard/FolderManager";
import { Pagination } from "@/components/dashboard/Pagination";
import { buttonVariants } from "@/components/ui/Button";
import { listQrCodesPage } from "@/lib/qr/queries";
import { parseQrListSearchParams, type QrListSearchParams } from "@/lib/qr/list-filters";
import { listMyFolders } from "@/lib/folders/queries";

interface QrCodesListPageProps {
  searchParams: Promise<QrListSearchParams>;
}

export default async function QrCodesListPage({ searchParams }: QrCodesListPageProps) {
  const rawParams = await searchParams;
  const filters = parseQrListSearchParams(rawParams);
  const hasActiveFilters = Object.keys(filters).some((key) => key !== "page");

  const [{ items, totalCount, page, pageCount, pageSize }, folders] = await Promise.all([
    listQrCodesPage(filters),
    listMyFolders(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Your QR Codes"
        action={
          <Link href="/dashboard/qr-codes/new" className={buttonVariants({ size: "sm" })}>
            Create QR
          </Link>
        }
      />

      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6">
        <QRCodesFilterBar folders={folders} />

        {totalCount === 0 && !hasActiveFilters ? (
          <EmptyState
            title="No QR codes yet"
            description="Create your first QR code to see it here."
            action={
              <Link
                href="/dashboard/qr-codes/new"
                className={buttonVariants({ className: "mt-2" })}
              >
                Create QR Code
              </Link>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No matching QR codes"
            description="Try a different search term, or clear your filters."
            action={
              <Link
                href="/dashboard/qr-codes"
                className="mt-2 text-sm text-primary hover:underline"
              >
                Clear filters
              </Link>
            }
          />
        ) : (
          <>
            <QRCodeListContainer items={items} folders={folders} />
            <Pagination
              page={page}
              pageCount={pageCount}
              totalCount={totalCount}
              pageSize={pageSize}
            />
          </>
        )}

        <FolderManager folders={folders} />
      </div>
    </div>
  );
}
