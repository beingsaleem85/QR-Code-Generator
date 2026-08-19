import { notFound } from "next/navigation";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";
import { getQrCodeById } from "@/lib/qr/queries";

export default async function QrCodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qrCode = await getQrCodeById(id);

  if (!qrCode) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <QRGeneratorShell
        variant="edit"
        qrCodeId={qrCode.id}
        initialName={qrCode.name}
        initialMode={qrCode.mode}
        initialQrType={qrCode.qrType}
        initialContent={qrCode.payloadData}
        initialDesign={qrCode.designConfig}
        initialSlug={qrCode.slug}
        initialPublicToken={qrCode.publicToken}
      />
    </div>
  );
}
