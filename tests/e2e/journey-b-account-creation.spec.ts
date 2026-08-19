import { expect, test } from "@playwright/test";
import { signUpAndWaitForDashboard, uniqueTestEmail } from "./helpers/test-user";

/**
 * Journey B — Account Creation (master prompt Module 3.16).
 * Sign up -> enter dashboard -> create saved QR -> see it in list.
 */
test.describe("Journey B — Account Creation", () => {
  test("signs up, saves a QR code, and sees it in the dashboard list", async ({ page }) => {
    const email = uniqueTestEmail("journey-b");
    await signUpAndWaitForDashboard(page, email);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto("/dashboard/qr-codes/new");
    const qrName = `Journey B QR ${Date.now()}`;
    await page.getByLabel("QR name").fill(qrName);
    await page.getByRole("option", { name: "URL / Link" }).click();
    await page.getByLabel("Destination URL").fill("https://example.com/journey-b");
    await page.getByRole("button", { name: "Save QR" }).click();

    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: qrName })).toBeVisible();

    await page.goto("/dashboard/qr-codes");
    await expect(page.getByRole("link", { name: qrName }).first()).toBeVisible();
  });
});
