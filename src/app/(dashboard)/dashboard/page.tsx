import Link from "next/link";
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { buttonVariants } from "@/components/ui/Button";
import { getMyQrCodeStats, listQrCodesPage } from "@/lib/qr/queries";

const RECENT_COUNT = 3;

/**
 * Real database queries throughout (Module 3.10) — `get_my_qr_code_stats`
 * for the aggregate cards, a 3-row `listQrCodesPage` call for "Recent",
 * neither ever fetches the user's full QR list just to derive a few
 * numbers or the newest handful of rows.
 */
export default async function DashboardOverviewPage() {
  const [stats, recentPage] = await Promise.all([
    getMyQrCodeStats(),
    listQrCodesPage({ pageSize: RECENT_COUNT, sortBy: "updated_at", sortDirection: "desc" }),
  ]);
  const recent = recentPage.items;

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="Overview"
        action={
          <Link href="/dashboard/qr-codes/new" className={buttonVariants({ size: "sm" })}>
            Create QR
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-4 pb-6 sm:px-6">
        <AnalyticsSummaryCards
          cards={[
            { label: "Total QR Codes", value: String(stats.totalCount) },
            { label: "Dynamic QR Codes", value: String(stats.dynamicCount) },
            { label: "Total Scans", value: stats.totalScans.toLocaleString() },
            { label: "Scans This Period", value: "—" },
          ]}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent QR Codes</h2>
            <Link href="/dashboard/qr-codes" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No QR codes yet — create your first one to see it here.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((qrCode) => (
                <QRCodeCard key={qrCode.id} qrCode={qrCode} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
