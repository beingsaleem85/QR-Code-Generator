import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const FEATURES = [
  {
    title: "Real-time preview",
    description: "Watch your QR code update as you type — no surprises at download time.",
  },
  {
    title: "Full design control",
    description: "Colors, frames, corner styles, and logos — without breaking scannability.",
  },
  {
    title: "Scan analytics",
    description: "See when and where your dynamic QR codes get scanned.",
  },
  {
    title: "Export anywhere",
    description: "Download crisp PNG or vector SVG, ready for print or web.",
  },
];

export function FeatureCards() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Why this generator"
          title="Everything you need, nothing you don't"
        />
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Card key={feature.title} className="flex flex-col gap-2 p-5">
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
