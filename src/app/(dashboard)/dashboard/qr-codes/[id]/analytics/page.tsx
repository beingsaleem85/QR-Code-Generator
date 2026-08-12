import { RouteStub } from "@/components/layout/RouteStub";

export default async function QrCodeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <RouteStub
      title={`Analytics: ${id}`}
      description="Scan analytics UI implemented in Module 2.8, real data wired in Module 3.7."
    />
  );
}
