import { describe, expect, it } from "vitest";
import {
  calculateTrialStatus,
  hasValidAccountAccess,
  FREE_TRIAL_DURATION_MS,
  FREE_TRIAL_DURATION_DAYS,
} from "@/lib/account/trial";
import type { Entitlement } from "@/lib/account/entitlements";

const FREE_ENTITLEMENT: Entitlement = {
  plan: "free",
  isLifetime: false,
  expiresAt: null,
  dynamicQrLimit: null,
};

const PRO_ENTITLEMENT: Entitlement = {
  plan: "pro",
  isLifetime: false,
  expiresAt: null,
  dynamicQrLimit: null,
};

const LIFETIME_ENTITLEMENT: Entitlement = {
  plan: "pro",
  isLifetime: true,
  expiresAt: null,
  dynamicQrLimit: null,
};

describe("14-Day Free Trial Expiry & Entitlement Rules", () => {
  const signupDateStr = "2026-09-01T10:00:00.000Z";
  const signupTime = new Date(signupDateStr).getTime();

  it("confirms 14-day duration equals exactly 1,209,600,000 milliseconds", () => {
    expect(FREE_TRIAL_DURATION_DAYS).toBe(14);
    expect(FREE_TRIAL_DURATION_MS).toBe(14 * 24 * 60 * 60 * 1000);
    expect(FREE_TRIAL_DURATION_MS).toBe(1_209_600_000);
  });

  // Boundary Test 1: Signup time + 13 days 23:59:59 -> Trial ACTIVE
  it("Boundary 1: Signup time + 13 days 23:59:59 is ACTIVE (1 second before expiry)", () => {
    const checkTime = new Date(signupTime + FREE_TRIAL_DURATION_MS - 1000);
    const status = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime);

    expect(status.isFreeTrial).toBe(true);
    expect(status.isTrialExpired).toBe(false);
    expect(status.remainingMs).toBe(1000);
    expect(status.remainingHours).toBe(1);
    expect(status.displayText).toBe("Free Trial • 1 hour remaining");
    expect(hasValidAccountAccess(signupDateStr, FREE_ENTITLEMENT, checkTime)).toBe(true);
  });

  // Boundary Test 2: Signup time + exactly 14 days -> Trial EXPIRED
  it("Boundary 2: Signup time + exactly 14 days (to the exact millisecond) is EXPIRED", () => {
    const checkTime = new Date(signupTime + FREE_TRIAL_DURATION_MS);
    const status = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime);

    expect(status.isFreeTrial).toBe(true);
    expect(status.isTrialExpired).toBe(true);
    expect(status.remainingMs).toBe(0);
    expect(status.remainingDays).toBe(0);
    expect(status.remainingHours).toBe(0);
    expect(status.displayText).toBe("Free Trial Expired");
    expect(hasValidAccountAccess(signupDateStr, FREE_ENTITLEMENT, checkTime)).toBe(false);
  });

  // Boundary Test 3: Signup time + 14 days + 1 second -> Trial EXPIRED
  it("Boundary 3: Signup time + 14 days + 1 second is EXPIRED", () => {
    const checkTime = new Date(signupTime + FREE_TRIAL_DURATION_MS + 1000);
    const status = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime);

    expect(status.isFreeTrial).toBe(true);
    expect(status.isTrialExpired).toBe(true);
    expect(status.remainingMs).toBe(0);
    expect(status.displayText).toBe("Free Trial Expired");
    expect(hasValidAccountAccess(signupDateStr, FREE_ENTITLEMENT, checkTime)).toBe(false);
  });

  // Boundary Test 4: Pro user older than 14 days -> ACTIVE
  it("Boundary 4: Pro user older than 14 days (e.g. 30 days old) is ACTIVE", () => {
    const checkTime = new Date(signupTime + 30 * 24 * 60 * 60 * 1000);
    const status = calculateTrialStatus(signupDateStr, PRO_ENTITLEMENT, checkTime);

    expect(status.isFreeTrial).toBe(false);
    expect(status.isTrialExpired).toBe(false);
    expect(status.displayText).toBe("Pro");
    expect(hasValidAccountAccess(signupDateStr, PRO_ENTITLEMENT, checkTime)).toBe(true);
  });

  // Boundary Test 5: Lifetime user older than 14 days -> ACTIVE
  it("Boundary 5: Lifetime user older than 14 days (e.g. 100 days old) is ACTIVE", () => {
    const checkTime = new Date(signupTime + 100 * 24 * 60 * 60 * 1000);
    const status = calculateTrialStatus(signupDateStr, LIFETIME_ENTITLEMENT, checkTime);

    expect(status.isFreeTrial).toBe(false);
    expect(status.isTrialExpired).toBe(false);
    expect(status.displayText).toBe("Lifetime Pro");
    expect(hasValidAccountAccess(signupDateStr, LIFETIME_ENTITLEMENT, checkTime)).toBe(true);
  });

  it("formats remaining days correctly for multi-day periods", () => {
    // 5 days elapsed -> 9 days remaining
    const checkTime = new Date(signupTime + 5 * 24 * 60 * 60 * 1000);
    const status = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime);

    expect(status.isTrialExpired).toBe(false);
    expect(status.remainingDays).toBe(9);
    expect(status.displayText).toBe("Free Trial • 9 days remaining");
  });

  it("formats remaining days correctly when 1 day remains", () => {
    // 12.5 days elapsed -> 1.5 days remaining -> rounded up to 2 days
    const checkTime1 = new Date(signupTime + 12.5 * 24 * 60 * 60 * 1000);
    const status1 = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime1);
    expect(status1.remainingDays).toBe(2);
    expect(status1.displayText).toBe("Free Trial • 2 days remaining");

    // 13.1 days elapsed -> 0.9 days remaining (less than 24 hours -> hours mode)
    const checkTime2 = new Date(signupTime + 13.1 * 24 * 60 * 60 * 1000);
    const status2 = calculateTrialStatus(signupDateStr, FREE_ENTITLEMENT, checkTime2);
    expect(status2.displayText).toMatch(/Free Trial • \d+ hours remaining/);
  });

  it("handles accounts created before feature implementation without grace period", () => {
    // Account created 20 days ago
    const oldSignup = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString();
    const status = calculateTrialStatus(oldSignup, FREE_ENTITLEMENT);

    expect(status.isTrialExpired).toBe(true);
    expect(status.displayText).toBe("Free Trial Expired");
    expect(hasValidAccountAccess(oldSignup, FREE_ENTITLEMENT)).toBe(false);
  });

  it("treats expired Pro plan as subject to Free trial from signup time", () => {
    // Pro plan expired yesterday, signup was 25 days ago -> expired
    const expiredPro: Entitlement = {
      plan: "pro",
      isLifetime: false,
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      dynamicQrLimit: null,
    };
    const oldSignup = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString();
    const status = calculateTrialStatus(oldSignup, expiredPro);

    expect(status.isTrialExpired).toBe(true);
    expect(status.displayText).toBe("Free Trial Expired");
  });
});
