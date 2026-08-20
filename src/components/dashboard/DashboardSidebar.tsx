"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderOpen, LayoutDashboard, PlusCircle, QrCode, Settings, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Logo } from "@/components/layout/Logo";

/** Presentation-only lookup, keyed by href (the nav items' existing unique
 * key) — kept separate from the shared nav-items data so this purely visual
 * addition never touches the data both the sidebar and MobileNavDrawer read. */
const NAV_ICONS: Record<string, LucideIcon> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/qr-codes": QrCode,
  "/dashboard/qr-codes/new": PlusCircle,
  "/dashboard/files": FolderOpen,
  "/dashboard/account": User,
  "/dashboard/settings": Settings,
};

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
    <nav
      aria-label="Dashboard"
      className="flex h-full w-56 flex-col gap-1 border-r border-border bg-surface p-3"
    >
      <div className="mb-2 px-2 py-2">
        <Logo />
      </div>
      {DASHBOARD_NAV_ITEMS.map((item) => {
        const active = item.href === activeHref;
        const Icon = NAV_ICONS[item.href];

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-background"
            }`}
          >
            {Icon ? <Icon size={17} aria-hidden="true" className="shrink-0" /> : null}
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
