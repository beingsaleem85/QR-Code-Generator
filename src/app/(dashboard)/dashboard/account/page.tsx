import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getMyEntitlement, planLabel } from "@/lib/account/entitlements";
import { MOCK_PROFILE } from "@/lib/account/mock-data";

export default async function AccountPage() {
  // Real end-to-end (unlike the rest of this page, still MOCK_PROFILE-driven
  // until a future module wires the real profile) — the plan itself is a
  // security-relevant fact, not display data, so it always reflects the
  // actually-signed-in user's real entitlement.
  const entitlement = await getMyEntitlement();

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Account" />

      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6 lg:max-w-lg">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar name={MOCK_PROFILE.displayName} avatarUrl={MOCK_PROFILE.avatarUrl} />
            <div>
              <p className="text-sm font-medium text-foreground">{MOCK_PROFILE.displayName}</p>
              <p className="text-xs text-muted-foreground">{MOCK_PROFILE.email}</p>
            </div>
          </div>

          <AccountProfileForm
            initialDisplayName={MOCK_PROFILE.displayName}
            email={MOCK_PROFILE.email}
          />
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Plan</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entitlement.plan === "pro"
                  ? "bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground"
              }`}
            >
              {planLabel(entitlement)}
            </span>
          </div>
          {entitlement.plan === "pro" && !entitlement.isLifetime && entitlement.expiresAt ? (
            <p className="text-xs text-muted-foreground">
              Renews {new Date(entitlement.expiresAt).toLocaleDateString()}
            </p>
          ) : null}
        </Card>

        <Card className="flex flex-col gap-3 p-5">
          <p className="text-sm font-medium text-foreground">Password &amp; security</p>
          <p className="text-xs text-muted-foreground">
            Change your password or manage sign-in security once your account is connected to
            Supabase Auth.
          </p>
          <div>
            <Button variant="secondary" disabled>
              Change password
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
