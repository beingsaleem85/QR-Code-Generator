import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { buttonVariants } from "@/components/ui/Button";

const NAV_LINKS = [
  { label: "Generator", href: "/qr-generator" },
  { label: "Static QR", href: "/static-qr" },
  { label: "Dynamic QR", href: "/dynamic-qr" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
];

import { createClient } from "@/lib/supabase/server";

export async function Header() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Non-blocking fallback for edge renders
    user = null;
  }

  const authLabel = user ? "Dashboard" : "Log in";
  const authHref = user ? "/dashboard" : "/login";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Primary" className="hidden md:flex md:items-center md:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors duration-150 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href={authHref} className="text-sm font-medium text-foreground hover:text-primary">
            {authLabel}
          </Link>
          <Link href="/qr-generator" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Create QR Code
          </Link>
        </div>

        <MobileNavDrawer
          links={[...NAV_LINKS, { label: authLabel, href: authHref }]}
          cta={{ label: "Create QR Code", href: "/qr-generator" }}
        />
      </div>
    </header>
  );
}
