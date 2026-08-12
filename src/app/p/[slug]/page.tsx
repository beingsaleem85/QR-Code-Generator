import { RouteStub } from "@/components/layout/RouteStub";

export default async function HostedLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <RouteStub
      title={`Landing page: ${slug}`}
      description="Hosted mini-page (links, PDF, gallery, etc.), implemented in Module 3.9."
    />
  );
}
