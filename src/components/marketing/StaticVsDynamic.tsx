import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const OPTIONS = [
  {
    title: "Static QR Codes",
    description:
      "The content is baked into the code itself. Simple and permanent — perfect for a one-off flyer, business card, or menu that won't change.",
    href: "/static-qr",
    cta: "Learn about Static QR",
  },
  {
    title: "Dynamic QR Codes",
    description:
      "Points to a short link you control, so you can update the destination, track scans, and pause a code — even after it's already printed.",
    href: "/dynamic-qr",
    cta: "Learn about Dynamic QR",
  },
];

export function StaticVsDynamic() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading
        eyebrow="Two ways to generate"
        title="Static or dynamic — pick what fits"
        description="Every QR type on this platform can be generated as a static code. Most can also go dynamic, so you stay in control after it's printed."
      />
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <Card key={option.href} className="flex flex-col gap-3 p-6">
            <h3 className="text-lg font-semibold text-foreground">{option.title}</h3>
            <p className="text-sm text-muted-foreground">{option.description}</p>
            <Link
              href={option.href}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              {option.cta} &rarr;
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
