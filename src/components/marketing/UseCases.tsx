import { SectionHeading } from "@/components/marketing/SectionHeading";

const USE_CASES = [
  {
    title: "Restaurants & menus",
    description: "Contactless menus that update without reprinting.",
  },
  {
    title: "Retail & packaging",
    description: "Link products to reviews, manuals, or restock pages.",
  },
  {
    title: "Events & invites",
    description: "Share schedules, RSVPs, or Wi-Fi details at the door.",
  },
  {
    title: "Marketing campaigns",
    description: "Track scans by channel and swap destinations anytime.",
  },
];

export function UseCases() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="Use cases" title="Built for how people actually use QR codes" />
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {USE_CASES.map((useCase) => (
          <li key={useCase.title} className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-foreground">{useCase.title}</h3>
            <p className="text-sm text-muted-foreground">{useCase.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
