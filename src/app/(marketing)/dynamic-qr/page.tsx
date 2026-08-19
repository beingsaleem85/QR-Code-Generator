import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Dynamic QR Codes",
  description:
    "How dynamic QR codes work — editable destinations, pause and reactivate, scan analytics — and which QR types require one.",
  alternates: { canonical: "/dynamic-qr" },
};

const POINTS = [
  {
    title: "One stable code, an editable destination",
    description:
      "A dynamic QR code points at a short link we host. You control where that link goes — change the destination, replace an uploaded file, or update hosted page content — any time, without reprinting.",
  },
  {
    title: "Pause and reactivate",
    description:
      "Turn a dynamic QR code off without deleting it. Visitors who scan a paused code see a clear message instead of a broken link; reactivating restores the original destination immediately.",
  },
  {
    title: "See who's scanning",
    description:
      "Every scan is logged — by day, device type, operating system, browser, and country — without storing a visitor's raw IP address or anything that identifies them individually.",
  },
];

export default function DynamicQrPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Dynamic QR codes</h1>
        <p className="max-w-2xl text-muted-foreground">
          Print once, update forever — with analytics on every scan.
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
        <h2 className="text-base font-semibold text-foreground">Which QR types require dynamic?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          File-based types — PDF, image galleries, audio — and hosted-page types —
          social/link-in-bio, multiple links, app-store landing pages, restaurant menus, and
          feedback collection — are dynamic-only, since they need a page to host their content.
          Every other type can be either static or dynamic; going dynamic adds an editable
          destination and scan analytics.
        </p>
      </div>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/qr-generator"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Create a dynamic QR code
        </Link>
        <Link
          href="/static-qr"
          className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
        >
          Compare with static
        </Link>
      </div>
    </div>
  );
}
