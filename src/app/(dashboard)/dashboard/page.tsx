import Link from "next/link";
import { AnalyticsSummaryCards } from "@/components/analytics/AnalyticsSummaryCards";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QRCodeCard } from "@/components/dashboard/QRCodeCard";
import { buttonVariants } from "@/components/ui/Button";
import { MOCK_QR_CODES } from "@/lib/qr/mock-data";

export default function DashboardOverviewPage() {
  const totalQrCodes = MOCK_QR_CODES.length;
  const dynamicQrCodes = MOCK_QR_CODES.filter((qr) => qr.mode === "dynamic").length;
  const totalScans = MOCK_QR_CODES.reduce((sum, qr) => sum + qr.scanCount, 0);
  const recent = [...MOCK_QR_CODES]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 3);

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
            { label: "Total QR Codes", value: String(totalQrCodes) },
            { label: "Dynamic QR Codes", value: String(dynamicQrCodes) },
            { label: "Total Scans", value: totalScans.toLocaleString() },
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((qrCode) => (
              <QRCodeCard key={qrCode.id} qrCode={qrCode} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
