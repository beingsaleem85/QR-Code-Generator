import type { Metadata } from "next";
import { QRGeneratorShell } from "@/components/qr/QRGeneratorShell";

export const metadata: Metadata = {
  title: "QR Code Generator",
  description:
    "Create a custom QR code for a link, file, or hosted page — free-form design, static or dynamic, ready to download in seconds.",
  alternates: { canonical: "/qr-generator" },
};

export default function QrGeneratorPage() {
  return (
    <div className="p-6">
      <QRGeneratorShell />
    </div>
  );
}
