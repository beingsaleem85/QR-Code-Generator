import { notFound } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { getQrCodeById, listScanEvents } from "@/lib/qr/queries";
import { toQrCodeSummary } from "@/lib/qr/records";

export default async function QrCodeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = await getQrCodeById(id);

  if (!qrCode) {
    notFound();
  }

  const events = qrCode.mode === "dynamic" ? await listScanEvents(qrCode.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title={`Analytics: ${qrCode.name}`} />

      <div className="px-4 pb-6 sm:px-6">
        {qrCode.mode === "dynamic" ? (
          <AnalyticsView
            qrCode={toQrCodeSummary(qrCode)}
            events={events}
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
