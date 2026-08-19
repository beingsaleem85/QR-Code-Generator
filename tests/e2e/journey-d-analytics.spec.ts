import { expect, test } from "@playwright/test";
import { signUpAndWaitForDashboard, uniqueTestEmail } from "./helpers/test-user";

/**
 * Journey D — Analytics (master prompt Module 3.16).
 * Scan dynamic QR -> confirm scan recorded -> open analytics -> confirm
 * aggregate updates. Scan recording runs inside `after()` (non-blocking,
 * Module 3.7) so this polls the analytics page rather than assuming the
 * write has landed the instant the redirect response comes back.
 */
test.describe("Journey D — Analytics", () => {
  test("a real scan is recorded and reflected in the QR's analytics", async ({ page, context }) => {
    const email = uniqueTestEmail("journey-d");
    await signUpAndWaitForDashboard(page, email);

    await page.goto("/dashboard/qr-codes/new");
    await page.getByLabel("QR name").fill(`Journey D QR ${Date.now()}`);
    await page.getByRole("tab", { name: "dynamic" }).click();
    await page.getByRole("option", { name: "URL / Link" }).click();
    await page.getByLabel("Destination URL").fill("https://example.com/journey-d");
    await page.getByRole("button", { name: "Save QR" }).click();
    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });

    await expect(page.getByText("0 scans")).toBeVisible();

    const printedLinkText = await page.getByText(/\/r\//).first().textContent();
    const redirectPath = printedLinkText?.match(/\/r\/[a-z0-9]+/)?.[0];
    expect(redirectPath).toBeTruthy();

    const origin = new URL(page.url()).origin;
    const anonRequest = await context.browser()!.newContext({ baseURL: origin });
    const response = await anonRequest.request.get(redirectPath!, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    await anonRequest.close();

    await page.getByRole("link", { name: "View analytics" }).click();
    await page.waitForURL(/\/analytics$/);

    const totalScansCard = page.locator("div", { has: page.getByText("Total scans") }).last();
    await expect(async () => {
      await page.reload();
      await expect(totalScansCard.getByText("1", { exact: true })).toBeVisible();
    }).toPass({ timeout: 15_000, intervals: [1000, 2000, 3000] });
  });
});
