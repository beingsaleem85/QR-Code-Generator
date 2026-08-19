import type { Metadata } from "next";
import { AccordionItem } from "@/components/ui/AccordionItem";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Common questions about static vs. dynamic QR codes, supported QR types, file uploads, and scan analytics.",
  alternates: { canonical: "/faq" },
};

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What's the difference between a static and a dynamic QR code?",
    answer:
      "A static QR code encodes its content directly — a URL, text, Wi-Fi credentials — and can never be changed once printed. A dynamic QR code instead encodes a stable link of ours; you control where that link points, and can change the destination, pause it, or replace an uploaded file at any time without reprinting the code.",
  },
  {
    question: "Can I edit a dynamic QR code after it's been printed?",
    answer:
      "Yes. Editing a dynamic QR code's destination, content, or design never changes the printed code itself — only where it points. Pausing a dynamic QR code shows visitors a clear message instead of a broken link; reactivating it restores the original destination immediately.",
  },
  {
    question: "What types of QR codes can I create?",
    answer:
      "URLs, plain text, email, phone, SMS, WhatsApp, Wi-Fi, vCard contacts, and calendar events as static or dynamic codes; PDF, image galleries, and audio as dynamic codes with a hosted page; and dynamic-only hosted pages for social/link-in-bio profiles, multiple links, app-store landing pages, restaurant menus, and visitor feedback collection.",
  },
  {
    question: "Is there a file size or type limit for PDF, image, and audio QR codes?",
    answer:
      "Yes — PDFs up to 20MB, images (PNG/JPEG/WebP/GIF) up to 10MB each, and audio (MP3/M4A/WAV/OGG) up to 15MB. These limits are enforced by the storage system itself, not just checked in your browser.",
  },
  {
    question: "What scan data do you collect, and what don't you collect?",
    answer:
      "For a dynamic QR code, each scan records the timestamp, referrer, device type, operating system, and browser (parsed from standard technical headers), plus a country when your hosting platform provides one. We never store a visitor's raw IP address or any identifier that could single out an individual visitor across scans.",
  },
  {
    question: "Who can see feedback submitted through a Feedback QR code?",
    answer:
      "Only the QR code's owner can read the feedback it collects. A visitor sees a consent notice and must opt in before submitting anything, and a submission can't be edited or deleted once made — it's a permanent record for the owner.",
  },
  {
    question: "Can I organize my QR codes?",
    answer:
      "Yes — search by name, filter by type/mode/status, sort, and optionally group codes into folders. Archiving a QR code hides it from your main list without deleting its scan history; only deleting a QR code removes it (and its history) permanently, after a confirmation step.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {/* Standard Next.js pattern for JSON-LD: a raw script tag, not next/script (which is for
          executable, loadable scripts). Content is this file's own static array, never user
          input, so there's nothing here for dangerouslySetInnerHTML to be unsafe about. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
          Frequently asked questions
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Can&apos;t find what you&apos;re looking for? These cover the questions people ask most.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.question} title={item.question}>
            <p className="text-sm text-muted-foreground">{item.answer}</p>
          </AccordionItem>
        ))}
      </div>
    </div>
  );
}
