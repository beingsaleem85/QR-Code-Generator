import { AccountProfileForm } from "@/components/account/AccountProfileForm";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { getMyEntitlement, planLabel } from "@/lib/account/entitlements";
import { getMyProfile, resolveDisplayLabel } from "@/lib/account/profile";
import { countDynamicQrCodes } from "@/lib/qr/queries";

export default async function AccountPage() {
  // The plan itself is a security-relevant fact, not display data, so it
  // always reflects the actually-signed-in user's real entitlement — same
  // as the profile below: both come from the real Supabase Auth session,
  // never mock/placeholder data.
  const profile = await getMyProfile();
  const entitlement = await getMyEntitlement();
  const dynamicQrCount = await countDynamicQrCodes();
  const displayLabel = resolveDisplayLabel(profile);

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="Account" />

      <div className="flex flex-col gap-4 px-4 pb-6 sm:px-6 lg:max-w-lg">
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar name={displayLabel} avatarUrl={profile.avatarUrl} />
            <div>
              <p className="text-sm font-medium text-foreground">{displayLabel}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <AccountProfileForm
            initialDisplayName={profile.displayName ?? ""}
            email={profile.email}
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
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Dynamic QR codes</p>
            <p className="text-xs font-medium text-foreground">
              {entitlement.dynamicQrLimit === null
                ? "Unlimited"
                : `${dynamicQrCount} / ${entitlement.dynamicQrLimit}`}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col gap-4 p-5">
          <p className="text-sm font-medium text-foreground">Password &amp; security</p>
          <ChangePasswordForm />
        </Card>
      </div>
    </div>
  );
}
