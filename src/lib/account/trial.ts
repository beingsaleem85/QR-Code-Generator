import type { Entitlement } from "@/lib/account/entitlements";

export const FREE_TRIAL_DURATION_DAYS = 14;
export const FREE_TRIAL_DURATION_MS = FREE_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000; // 1,209,600,000 ms

export interface TrialInfo {
  /** Whether the account is on the Free tier. False for paid Pro/Lifetime accounts. */
  isFreeTrial: boolean;
  /** True if the 14-day Free trial has expired. False for active Free trial and paid accounts. */
  isTrialExpired: boolean;
  /** Exact expiration Date for Free accounts, null for paid accounts. */
  trialExpiresAt: Date | null;
  /** Milliseconds remaining in the trial. 0 if expired, Infinity if paid. */
  remainingMs: number;
  /** Days remaining in the trial (rounded up). 0 if expired, Infinity if paid. */
  remainingDays: number;
  /** Hours remaining in the trial (rounded up). 0 if expired, Infinity if paid. */
  remainingHours: number;
  /** Formatted human-readable status string for display. */
  displayText: string;
}

/**
 * Pure, timestamp-accurate calculation of trial status based on the authoritative
 * signup timestamp (auth.users.created_at).
 *
 * Expiration rule:
 * trialExpiresAt = signupCreatedAt + 14 days
 * Comparison is accurate to the exact second: now >= trialExpiresAt -> expired.
 *
 * @param signupCreatedAt ISO 8601 string or Date from auth.users.created_at
 * @param entitlement Account entitlement from account_entitlements
 * @param now Current timestamp (defaults to server current time)
 */
export function calculateTrialStatus(
  signupCreatedAt: string | Date | undefined | null,
  entitlement: Entitlement,
  now: Date = new Date(),
): TrialInfo {
  // Pro or Lifetime accounts bypass all Free trial restrictions
  const isPaid =
    entitlement.isLifetime ||
    (entitlement.plan === "pro" &&
      (entitlement.expiresAt === null || new Date(entitlement.expiresAt) > now));

  if (isPaid) {
    const paidLabel = entitlement.isLifetime ? "Lifetime Pro" : "Pro";
    return {
      isFreeTrial: false,
      isTrialExpired: false,
      trialExpiresAt: null,
      remainingMs: Infinity,
      remainingDays: Infinity,
      remainingHours: Infinity,
      displayText: paidLabel,
    };
  }

  // Free account: calculate exact 14-day expiry from signupCreatedAt
  const signupTime = signupCreatedAt ? new Date(signupCreatedAt).getTime() : now.getTime();
  const expiresAtMs = signupTime + FREE_TRIAL_DURATION_MS;
  const trialExpiresAt = new Date(expiresAtMs);
  const nowMs = now.getTime();

  // Exactly 14 days or beyond: expired (now >= expiresAt)
  const isTrialExpired = nowMs >= expiresAtMs;
  const remainingMs = Math.max(0, expiresAtMs - nowMs);

  let displayText = "Free Trial Expired";
  let remainingDays = 0;
  let remainingHours = 0;

  if (!isTrialExpired) {
    remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

    if (remainingMs >= 24 * 60 * 60 * 1000) {
      displayText = `Free Trial • ${remainingDays} day${remainingDays === 1 ? "" : "s"} remaining`;
    } else {
      const hours = Math.max(1, remainingHours);
      displayText = `Free Trial • ${hours} hour${hours === 1 ? "" : "s"} remaining`;
    }
  }

  return {
    isFreeTrial: true,
    isTrialExpired,
    trialExpiresAt,
    remainingMs,
    remainingDays,
    remainingHours,
    displayText,
  };
}

/**
 * Determines whether an account has valid access to create QR codes and have active dynamic QRs.
 * Paid accounts always have access. Free accounts have access only while within the 14-day trial window.
 */
export function hasValidAccountAccess(
  signupCreatedAt: string | Date | undefined | null,
  entitlement: Entitlement,
  now: Date = new Date(),
): boolean {
  const trial = calculateTrialStatus(signupCreatedAt, entitlement, now);
  return !trial.isTrialExpired;
}
