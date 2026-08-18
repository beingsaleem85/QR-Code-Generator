"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { LogoutButton } from "@/components/dashboard/LogoutButton";

/**
 * Picks the single most specific nav item matching the current path (e.g.
 * on /dashboard/qr-codes/new, "Create QR" wins over "QR Codes" even though
 * both hrefs are prefixes) rather than letting multiple items match at once.
 */
function findActiveHref(pathname: string): string | undefined {
  return [...DASHBOARD_NAV_ITEMS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const activeHref = findActiveHref(pathname);

  return (
    <nav aria-label="Dashboard" className="flex w-56 flex-col gap-1 border-r border-border p-3">
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const active = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-background"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mt-2 border-t border-border pt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}
