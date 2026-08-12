import { AnalyticsChartShell } from "@/components/analytics/AnalyticsChartShell";
import { SectionHeading } from "@/components/marketing/SectionHeading";

export function AnalyticsPreview() {
  return (
    <section className="bg-background">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
        <SectionHeading
          align="left"
          eyebrow="Track every scan"
          title="Built-in analytics for dynamic QR codes"
          description="Dynamic codes come with scan counts, device breakdowns, and location data at a glance — no extra setup, no separate tool."
        />
        <AnalyticsChartShell title="Scans over time" />
      </div>
    </section>
  );
}
