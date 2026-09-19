import type { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DASHBOARD_NAV_ITEMS } from "@/components/dashboard/nav-items";
import { LogoutButton } from "@/components/dashboard/LogoutButton";
import { Logo } from "@/components/layout/Logo";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { getAuthenticatedUser } from "@/lib/supabase/dal";

import { createClient } from "@/lib/supabase/server";
import { getEntitlementForUser } from "@/lib/account/entitlements";
import { calculateTrialStatus } from "@/lib/account/trial";
import { TrialStatusWidget } from "@/components/dashboard/TrialStatusWidget";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // Secure, database-verified re-check — proxy.ts's cookie-based check is
  // optimistic only. Redirects to /login if there's no valid session.
  const user = await getAuthenticatedUser();
  const supabase = await createClient();
  const entitlement = await getEntitlementForUser(supabase, user.id);
  const trialInfo = calculateTrialStatus(user.created_at, entitlement);

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:block">
        <DashboardSidebar trialInfo={trialInfo} />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <Logo />
          <MobileNavDrawer
            links={DASHBOARD_NAV_ITEMS}
            footer={
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-2">
                <TrialStatusWidget trialInfo={trialInfo} />
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
