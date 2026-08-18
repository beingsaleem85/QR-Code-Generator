import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Logo } from "@/components/layout/Logo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { getAuthenticatedUser } from "@/lib/supabase/dal";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Secure, database-verified re-check — proxy.ts's cookie-based check is
  // optimistic only. Redirects to /login if there's no valid session.
  await getAuthenticatedUser();

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <DashboardSidebar />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <Logo />
          <MobileNavDrawer
            links={DASHBOARD_NAV_ITEMS}
            footer={
              <div className="mt-2 border-t border-border pt-2">
                <LogoutButton className="rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-background" />
              </div>
            }
          />
        </div>

        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}
