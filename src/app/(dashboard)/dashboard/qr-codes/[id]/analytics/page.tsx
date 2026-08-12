import { notFound } from "next/navigation";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Alert } from "@/components/ui/Alert";
import { MOCK_ANALYTICS_NOW, findMockQrCode, getMockScanEvents } from "@/lib/qr/mock-data";

export default async function QrCodeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = findMockQrCode(id);

  if (!qrCode) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title={`Analytics: ${qrCode.name}`} />

      <div className="px-4 pb-6 sm:px-6">
        {qrCode.mode === "dynamic" ? (
          <AnalyticsView
            qrCode={qrCode}
            events={getMockScanEvents(qrCode.id)}
            now={MOCK_ANALYTICS_NOW}
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
