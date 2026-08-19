import path from "node:path";
import { expect, test } from "@playwright/test";
import { signUpAndWaitForDashboard, uniqueTestEmail } from "./helpers/test-user";

/**
 * Journey F — File QR (master prompt Module 3.16).
 * Upload PDF -> save QR -> open landing/file route -> confirm access ->
 * replace PDF -> confirm the same dynamic QR resolves the new content.
 */
test.describe("Journey F — File QR", () => {
  test("uploading a PDF, saving, then replacing it serves the new file at the same landing page", async ({
    page,
    context,
  }) => {
    const email = uniqueTestEmail("journey-f");
    await signUpAndWaitForDashboard(page, email);

    await page.goto("/dashboard/qr-codes/new");
    await page.getByLabel("QR name").fill(`Journey F QR ${Date.now()}`);
    // PDF is dynamic-only (registry: staticSupport: false) — the type
    // selector only lists it once "dynamic" mode is active, so switch
    // first or "PDF" won't be in the list at all.
    await page.getByRole("tab", { name: "dynamic" }).click();
    await page.getByRole("option", { name: "PDF" }).click();

    const fileInput = page.locator("#pdf-upload");
    await fileInput.setInputFiles(path.join(__dirname, "fixtures", "sample-a.pdf"));
    await expect(page.getByText("sample-a.pdf")).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Save QR" }).click();
    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });

    const printedLinkText = await page.getByText(/\/p\//).first().textContent();
    const landingPath = printedLinkText?.match(/\/p\/[a-z0-9]+/)?.[0];
    expect(landingPath, "expected a printed /p/<slug> landing link").toBeTruthy();

    const origin = new URL(page.url()).origin;
    const anonContext = await context.browser()!.newContext({ baseURL: origin });
    const firstLandingResponse = await anonContext.request.get(landingPath!);
    expect(firstLandingResponse.status()).toBe(200);
    const firstBody = await firstLandingResponse.text();
    expect(firstBody).toContain("sample-a.pdf");
    await anonContext.close();

    // Replace the file — same dynamic QR, same landing slug, new content.
    await page.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/edit$/);
    await page
      .locator("#pdf-upload")
      .setInputFiles(path.join(__dirname, "fixtures", "sample-b.pdf"));
    await expect(page.getByText("sample-b.pdf")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });

    const anonContext2 = await context.browser()!.newContext({ baseURL: origin });
    const secondLandingResponse = await anonContext2.request.get(landingPath!);
    expect(secondLandingResponse.status()).toBe(200);
    const secondBody = await secondLandingResponse.text();
    expect(secondBody).toContain("sample-b.pdf");
    expect(secondBody).not.toContain("sample-a.pdf");
    await anonContext2.close();
  });
});
