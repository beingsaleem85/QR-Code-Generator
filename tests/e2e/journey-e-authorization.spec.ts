import { expect, test } from "@playwright/test";
import { signUpAndWaitForDashboard, uniqueTestEmail } from "./helpers/test-user";

/**
 * Journey E — Authorization (master prompt Module 3.16).
 * User A creates QR -> User B attempts direct access -> access must be
 * denied. A real cross-user RLS check, not a mocked one — matches this
 * project's own established live-verification discipline for RLS
 * (Modules 3.8-3.10 all re-proved this the same way).
 */
test.describe("Journey E — Authorization", () => {
  test("a second account cannot view or edit the first account's QR code by direct URL", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    const emailA = uniqueTestEmail("journey-e-a");
    await signUpAndWaitForDashboard(pageA, emailA);

    await pageA.goto("/dashboard/qr-codes/new");
    await pageA.getByLabel("QR name").fill(`Journey E QR ${Date.now()}`);
    await pageA.getByRole("option", { name: "URL / Link" }).click();
    await pageA.getByLabel("Destination URL").fill("https://example.com/journey-e");
    await pageA.getByRole("button", { name: "Save QR" }).click();
    await pageA.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });
    const qrId = pageA.url().match(/qr-codes\/([a-f0-9-]+)$/)?.[1];
    expect(qrId, "expected a real QR id from the save redirect").toBeTruthy();

    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    const emailB = uniqueTestEmail("journey-e-b");
    await signUpAndWaitForDashboard(pageB, emailB);

    // Direct access to User A's detail page, by URL, as User B. RLS blocks
    // the row read (getQrCodeById returns null -> notFound()); this app's
    // root Suspense boundary makes notFound() render with HTTP 200, not
    // 404 (a known, documented Next.js limitation — docs/ARCHITECTURE.md
    // under Module 2.7), so the real assertion is on rendered content, not
    // the status code.
    await pageB.goto(`/dashboard/qr-codes/${qrId}`);
    await expect(pageB.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await expect(pageB.getByText(/Journey E QR/)).toHaveCount(0);

    // Direct access to the edit route, same denial expected.
    await pageB.goto(`/dashboard/qr-codes/${qrId}/edit`);
    await expect(pageB.getByRole("heading", { name: "Page not found" })).toBeVisible();

    // User B's own list must never include User A's QR.
    await pageB.goto("/dashboard/qr-codes");
    await expect(pageB.getByRole("link", { name: /Journey E QR/ })).toHaveCount(0);

    await contextA.close();
    await contextB.close();
  });
});
