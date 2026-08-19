import type { Page } from "@playwright/test";

/**
 * Journeys B-F need a real, confirmed Supabase account. This project has no
 * dedicated test Supabase project (see docs/ARCHITECTURE.md's "Legal and
 * Privacy..."/"Performance and Reliability" sections on Docker/local Supabase
 * being unavailable in this environment) — these journeys run against the
 * real linked project with `mailer_autoconfirm` temporarily flipped on, the
 * same throwaway-account technique used for live verification since Module
 * 3.6. Signup returns a session immediately in that mode; without it, the
 * "check your email" gate blocks these journeys entirely, so a signup that
 * doesn't yield an immediate session throws with a message pointing at the
 * cause, rather than hanging or failing on some unrelated later assertion.
 */
export function uniqueTestEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.floor(Math.random() * 100000)}@example.com`;
}

export const TEST_PASSWORD = "correct-horse-battery-staple-1";

export async function signUpAndWaitForDashboard(page: Page, email: string): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(TEST_PASSWORD);
  await page.getByLabel("Confirm password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();

  const result = await Promise.race([
    page.waitForURL("**/dashboard", { timeout: 10_000 }).then(() => "dashboard" as const),
    page
      .getByText(/check your email/i)
      .waitFor({ timeout: 10_000 })
      .then(() => "email-gate" as const),
  ]).catch(() => "timeout" as const);

  if (result !== "dashboard") {
    throw new Error(
      `Signup for ${email} did not land on /dashboard (got "${result}"). This journey requires ` +
        "mailer_autoconfirm=true on the live Supabase project for the duration of the E2E run " +
        "— see docs/ARCHITECTURE.md's Module 3.16 section for the toggle command.",
    );
  }
}
