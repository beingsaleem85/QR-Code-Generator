import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";

export default function NewQrCodePage() {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <QRGeneratorShell />
    </div>
  );
}
