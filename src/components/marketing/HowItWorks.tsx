import { SectionHeading } from "@/components/marketing/SectionHeading";

const STEPS = [
  { title: "Pick a QR type", description: "Choose from links, contact cards, Wi-Fi, and more." },
  {
    title: "Customize the design",
    description: "Match your brand with colors, frames, and an optional logo.",
  },
  {
    title: "Download or save",
    description:
      "Export instantly, or create a free account to track and edit dynamic codes later.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="How it works" title="Three steps to your QR code" />
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="max-w-xs text-sm text-muted-foreground">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
