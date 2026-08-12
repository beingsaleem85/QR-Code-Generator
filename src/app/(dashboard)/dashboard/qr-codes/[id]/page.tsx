import { RouteStub } from "@/components/layout/RouteStub";

export default async function QrCodeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RouteStub
      title={`QR Code: ${id}`}
      description="Detail view (preview, status, downloads) implemented in Module 2.7."
    />
  );
}
