import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";
import { findMockQrCode } from "@/lib/qr/mock-data";

export default async function QrCodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = findMockQrCode(id);

  if (!qrCode) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <Alert variant="info">
        Only the name is pre-filled from your saved QR code right now — full content/design pre-fill
        and saving arrive with real persistence in Module 3.5.
      </Alert>
      <QRGeneratorShell variant="edit" initialName={qrCode.name} />
    </div>
  );
}
