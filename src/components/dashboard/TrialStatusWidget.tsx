"use client";

import Link from "next/link";
import { AlertCircle, Sparkles } from "lucide-react";
import type { TrialInfo } from "@/lib/account/trial";

interface TrialStatusWidgetProps {
  trialInfo: TrialInfo;
}

export function TrialStatusWidget({ trialInfo }: TrialStatusWidgetProps) {
  if (!trialInfo.isFreeTrial) {
    return (
      <div className="rounded-xl border border-border bg-background/50 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Sparkles size={14} aria-hidden="true" className="text-primary" />
          <span>{trialInfo.displayText}</span>
        </div>
      </div>
    );
  }

  if (trialInfo.isTrialExpired) {
    return (
      <div
        role="status"
        aria-label="Free Trial Expired"
        className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs"
      >
        <div className="flex items-center gap-1.5 font-semibold text-destructive">
          <AlertCircle size={14} aria-hidden="true" />
          <span>Free Trial Expired</span>
        </div>
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          Upgrade to create new QRs and reactivate dynamic QRs.
        </p>
        <Link
          href="/pricing"
          className="mt-2.5 block w-full rounded-lg bg-primary py-1.5 text-center text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  const periodText =
    trialInfo.remainingMs >= 24 * 60 * 60 * 1000
      ? `${trialInfo.remainingDays} day${trialInfo.remainingDays === 1 ? "" : "s"} remaining`
      : `${trialInfo.remainingHours} hour${trialInfo.remainingHours === 1 ? "" : "s"} remaining`;

  return (
    <div
      role="status"
      aria-label={`Free Trial — ${periodText}`}
      className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs"
    >
      <div className="flex items-center gap-1.5 font-semibold text-primary">
        <Sparkles size={14} aria-hidden="true" />
        <span>Free Trial</span>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">{periodText}</p>
      <Link
        href="/pricing"
        className="mt-2.5 block w-full rounded-lg bg-primary/10 py-1.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
