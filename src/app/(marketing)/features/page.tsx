import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/marketing/SectionHeading";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Every QR Code Generator feature in one place — real-time design, dynamic destinations, scan analytics, file-based QR types, and account security.",
  alternates: { canonical: "/features" },
};

interface FeatureGroup {
  heading: string;
  description: string;
  items: { title: string; description: string }[];
}

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    heading: "Design and generation",
    description: "A live preview and full styling control, for every QR type.",
    items: [
      {
        title: "Real-time preview",
        description: "Your QR code updates as you type — no surprises at download time.",
      },
      {
        title: "Full design control",
        description:
          "Colors, gradients, frames, corner styles, and a logo overlay — with built-in scannability checks (contrast, quiet zone, logo size) so a styled code still scans.",
      },
      {
        title: "Export anywhere",
        description:
          "Download crisp PNG at 512/1024/2048px, or a vector SVG that stays sharp at any size — regenerated fresh from your saved settings every time, never a stored image.",
      },
    ],
  },
  {
    heading: "Dynamic QR codes and analytics",
    description: "Print once, update forever — and see exactly who's scanning.",
    items: [
      {
        title: "Editable destinations",
        description:
          "A dynamic QR code always points at a stable link of ours. Change where it goes any time — the printed code never has to change.",
      },
      {
        title: "Pause and reactivate",
        description:
          "Turn a dynamic QR code off without deleting it. Visitors see a clear, branded page instead of a broken link.",
      },
      {
        title: "Scan analytics",
        description:
          "See scan counts by day, device type, OS, browser, and country — collected without storing raw IP addresses or anything that identifies an individual visitor.",
      },
    ],
  },
  {
    heading: "Beyond links",
    description: "Host real content, not just a redirect.",
    items: [
      {
        title: "Files: PDF, image galleries, audio",
        description:
          "Upload a PDF menu, a photo gallery, or an audio track and get a dynamic QR code with its own hosted page — replace the file later without reprinting.",
      },
      {
        title: "Hosted pages: social, links, menu, feedback",
        description:
          "Build a link-in-bio page, a restaurant menu, an app-store landing page, or collect visitor feedback — all from one QR code.",
      },
      {
        title: "Contact, Wi-Fi, and calendar codes",
        description:
          "vCard contact cards, Wi-Fi network logins, calendar events, email, SMS, and phone-call codes — the everyday QR types, done right.",
      },
    ],
  },
  {
    heading: "Organization and security",
    description: "Built to stay usable as your list of QR codes grows.",
    items: [
      {
        title: "Search, filter, and folders",
        description:
          "Find any QR code by name, type, status, or folder — backed by real database queries, so it stays fast no matter how many codes you have.",
      },
      {
        title: "Your data stays yours",
        description:
          "Every QR code, file, and analytics event is scoped to your account by database-level access rules — never just an app-level check.",
      },
      {
        title: "Abuse protection",
        description:
          "Rate limiting on public redirect and feedback endpoints, and safe handling of every stored link, so a printed code can't be turned into an attack vector.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Features</h1>
        <p className="max-w-2xl text-muted-foreground">
          Everything above covers real, working functionality — not a roadmap. Create a QR code to
          try any of it.
        </p>
      </div>

      <div className="mt-14 flex flex-col gap-14">
        {FEATURE_GROUPS.map((group) => (
          <section key={group.heading}>
            <SectionHeading
              eyebrow={undefined}
              title={group.heading}
              description={group.description}
            />
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <Card key={item.title} className="flex flex-col gap-2 p-5">
                  <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
