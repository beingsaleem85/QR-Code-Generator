import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Generator", href: "/qr-generator" },
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "QR Types",
    links: [
      { label: "All QR Types", href: "/qr-types" },
      { label: "Static QR", href: "/static-qr" },
      { label: "Dynamic QR", href: "/dynamic-qr" },
    ],
  },
  {
    title: "Resources",
    links: [{ label: "FAQ", href: "/faq" }],
  },
  {
    title: "Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4">
            <Logo />
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-foreground hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
          &copy; {year} QRForge. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
