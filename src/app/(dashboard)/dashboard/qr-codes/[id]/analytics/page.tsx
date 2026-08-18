import { notFound } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { getQrCodeById } from "@/lib/qr/queries";
import { toQrCodeSummary } from "@/lib/qr/records";

export default async function QrCodeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = await getQrCodeById(id);

  if (!qrCode) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title={`Analytics: ${qrCode.name}`} />

      <div className="px-4 pb-6 sm:px-6">
        {qrCode.mode === "dynamic" ? (
          // Real QR, genuinely zero real scan events — scan tracking itself
          // is Module 3.7's job. This honestly reflects that (an empty
          // dataset AnalyticsView already renders as "no scans yet"),
          // rather than a separate "coming soon" state duplicating that UI.
          <AnalyticsView
            qrCode={toQrCodeSummary(qrCode)}
            events={[]}
            now={new Date().toISOString()}
          />
        ) : (
          <Alert variant="info">
            Static QR codes don&apos;t track scans. Switch this QR code to dynamic mode to enable
            analytics.
          </Alert>
        )}
      </div>
    </div>
  );
}
