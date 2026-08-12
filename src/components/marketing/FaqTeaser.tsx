import Link from "next/link";
import { SectionHeading } from "@/components/marketing/SectionHeading";

const FAQS = [
  {
    question: "Is it free to use?",
    answer: "Yes — static QR codes are free to generate and download.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No, not for static QR codes. An account lets you save codes, go dynamic, and see analytics.",
  },
  {
    question: "Can I change a QR code after printing?",
    answer:
      "Only dynamic QR codes support that — the printed code stays the same, but you can update where it points.",
  },
];

export function FaqTeaser() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <SectionHeading eyebrow="FAQ" title="Common questions" />
      <dl className="mt-10 flex flex-col divide-y divide-border">
        {FAQS.map((faq) => (
          <div key={faq.question} className="py-4">
            <dt className="text-sm font-semibold text-foreground">{faq.question}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{faq.answer}</dd>
          </div>
        ))}
      </dl>
      <Link
        href="/faq"
        className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
      >
        View all FAQs &rarr;
      </Link>
    </section>
  );
}
