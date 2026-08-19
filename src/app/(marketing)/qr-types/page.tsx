import type { Metadata } from "next";
import Link from "next/link";
import { listQrTypeDefinitions } from "@/lib/qr/registry";
import { CONTENT_FORMS } from "@/components/qr/content-forms";
import { Card } from "@/components/ui/Card";
import type { QRType } from "@/types/qr";

export const metadata: Metadata = {
  title: "QR Code Types",
  description:
    "Every QR code type this generator supports — links, contact and Wi-Fi codes, file uploads, and hosted pages — with static vs. dynamic availability.",
  alternates: { canonical: "/qr-types" },
};

const TYPE_DESCRIPTIONS: Partial<Record<QRType, string>> = {
  url: "Point straight at any web page. The most common QR code, and the fastest to set up.",
  text: "Encode a plain text message — no app or link required to read it, just a scan.",
  email: "Pre-fill a recipient, subject, and body so scanning opens a ready-to-send draft.",
  phone: "One scan, one tap to call — useful on posters, vehicles, and storefronts.",
  sms: "Open a text message pre-addressed and pre-filled, ready to send with one tap.",
  vcard:
    "Share a full contact card — name, phone, email, company — saved straight to the scanner's contacts.",
  whatsapp: "Open a WhatsApp chat with your number and an optional pre-filled message.",
  wifi: "Let guests join your Wi-Fi network without typing a password — scan and connect.",
  event: "Add an event straight to a calendar app, with date, time, and location included.",
  pdf: "Host a PDF — a menu, brochure, or datasheet — behind a QR code you can update anytime.",
  images: "Share a photo gallery behind a single code, viewable on any device.",
  audio: "Link a QR code to an audio track — a voice message, a guide, or a soundtrack.",
  video: "Point a QR code at a video, whether hosted elsewhere or shared as a direct link.",
  app: "Send visitors to the right app-store listing automatically, based on their device.",
  social: "A link-in-bio style page collecting all your social profiles behind one code.",
  multi_link: "A single landing page linking out to several destinations of your choosing.",
  menu: "A restaurant menu with sections, items, and photos, hosted on its own page.",
  feedback: "Collect visitor feedback and ratings through a page reachable by a single scan.",
  barcode_2d: "Data Matrix and other 2D barcode formats, for inventory and ticketing use cases.",
  location: "Drop a pin that opens directly in the scanner's maps app.",
};

export default function QrTypesPage() {
  const types = listQrTypeDefinitions();
  const available = types.filter((type) => CONTENT_FORMS[type.key]);
  const comingSoon = types.filter((type) => !CONTENT_FORMS[type.key]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">QR code types</h1>
        <p className="max-w-2xl text-muted-foreground">
          Pick the type that matches what you&apos;re sharing. Types marked dynamic can be edited or
          paused after printing; static types are fixed once created.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {available.map((type) => (
          <Card key={type.key} className="flex flex-col gap-2 p-5">
            <h2 className="text-base font-semibold text-foreground">{type.label}</h2>
            <p className="text-sm text-muted-foreground">{TYPE_DESCRIPTIONS[type.key]}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {type.staticSupport && type.dynamicSupport
                ? "Static or dynamic"
                : type.dynamicSupport
                  ? "Dynamic only"
                  : "Static only"}
            </p>
          </Card>
        ))}
      </div>

      {comingSoon.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold text-foreground">Coming soon</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoon.map((type) => (
              <Card key={type.key} className="flex flex-col gap-2 p-5 opacity-70">
                <h3 className="text-base font-semibold text-foreground">{type.label}</h3>
                <p className="text-sm text-muted-foreground">{TYPE_DESCRIPTIONS[type.key]}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-14 flex justify-center">
        <Link
          href="/qr-generator"
          className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Start creating a QR code
        </Link>
      </div>
    </div>
  );
}
