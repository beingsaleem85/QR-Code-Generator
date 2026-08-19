import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Static QR Codes",
  description:
    "How static QR codes work, when to use one instead of a dynamic code, and which QR types support them.",
  alternates: { canonical: "/static-qr" },
};

const POINTS = [
  {
    title: "The content lives in the code",
    description:
      "A static QR code encodes its destination directly — a URL, a Wi-Fi password, a vCard — with nothing stored on a server. Scan it offline years from now and it still works exactly the same.",
  },
  {
    title: "Nothing to break",
    description:
      "There's no link to expire and no account to keep active. Once printed, a static QR code has no dependency on anything but the paper it's printed on.",
  },
  {
    title: "But it can't be changed",
    description:
      "Whatever you encode is permanent. A typo, an outdated phone number, or a business that's moved means reprinting — static codes don't support edits, pausing, or scan analytics.",
  },
];

export default function StaticQrPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Static QR codes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Simple, permanent, and self-contained — the right choice when content never needs to
          change.
        </p>
      </div>

      <div className="mt-12 flex flex-col gap-6">
        {POINTS.map((point) => (
          <Card key={point.title} className="flex flex-col gap-2 p-6">
            <h2 className="text-lg font-semibold text-foreground">{point.title}</h2>
            <p className="text-sm text-muted-foreground">{point.description}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-base font-semibold text-foreground">Which QR types support static?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          URL, text, email, phone, SMS, WhatsApp, Wi-Fi, vCard, event, and video codes can all be
          generated as static. File-based types (PDF, image galleries, audio) and hosted-page types
          (social, multi-link, app links, menu, feedback) require a dynamic code, since they need a
          page to host the content.
        </p>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/qr-generator"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create a static QR code
        </Link>
        <Link
          href="/dynamic-qr"
          className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
        >
          Compare with dynamic
        </Link>
      </div>
    </div>
  );
}
