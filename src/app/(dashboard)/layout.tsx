import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { Logo } from "@/components/layout/Logo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Logo />
          <MobileNavDrawer links={DASHBOARD_NAV_ITEMS} />
        </div>

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
