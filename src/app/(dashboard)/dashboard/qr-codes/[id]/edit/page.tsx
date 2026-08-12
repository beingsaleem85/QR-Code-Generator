import { RouteStub } from "@/components/layout/RouteStub";

export default async function QrCodeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RouteStub
      title={`Edit QR Code: ${id}`}
      description="Edit flow, reusing generator content/design panels, implemented in Module 2.7."
    />
  );
}
