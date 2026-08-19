import { expect, test } from "@playwright/test";
import { signUpAndWaitForDashboard, uniqueTestEmail } from "./helpers/test-user";

/**
 * Journey C — Dynamic QR (master prompt Module 3.16).
 * Create dynamic link QR -> visit redirect -> confirm destination -> change
 * destination -> revisit same QR redirect -> confirm new destination.
 */
test.describe("Journey C — Dynamic QR", () => {
  test("editing a dynamic QR's destination changes where its redirect resolves to", async ({
    page,
    context,
  }) => {
    const email = uniqueTestEmail("journey-c");
    await signUpAndWaitForDashboard(page, email);

    await page.goto("/dashboard/qr-codes/new");
    await page.getByLabel("QR name").fill(`Journey C QR ${Date.now()}`);
    await page.getByRole("tab", { name: "dynamic" }).click();
    await page.getByRole("option", { name: "URL / Link" }).click();
    await page.getByLabel("Destination URL").fill("https://example.com/journey-c/first");
    await page.getByRole("button", { name: "Save QR" }).click();
    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });

    const printedLinkText = await page.getByText(/\/r\//).first().textContent();
    const redirectPath = printedLinkText?.match(/\/r\/[a-z0-9]+/)?.[0];
    expect(redirectPath, "expected a printed /r/<slug> link on the detail page").toBeTruthy();

    // Hit the redirect anonymously (no session/cookies) and inspect the
    // 307 response directly, without following it — the destination is a
    // placeholder domain (example.com) that isn't a real page to land on,
    // so what matters is the Location header /r/[slug] actually resolves
    // to, not what example.com itself returns for that path.
    const origin = new URL(page.url()).origin;
    const anonRequest = await context.browser()!.newContext({ baseURL: origin });
    const firstResponse = await anonRequest.request.get(redirectPath!, { maxRedirects: 0 });
    expect(firstResponse.status()).toBe(307);
    expect(firstResponse.headers()["location"]).toBe("https://example.com/journey-c/first");
    await anonRequest.close();

    // Change the destination, without ever regenerating the slug/link.
    await page.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL(/\/edit$/);
    const urlField = page.getByLabel("Destination URL");
    await urlField.fill("");
    await urlField.fill("https://example.com/journey-c/second");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForURL(/\/dashboard\/qr-codes\/[a-f0-9-]+$/, { timeout: 10_000 });

    const anonRequest2 = await context.browser()!.newContext({ baseURL: origin });
    const secondResponse = await anonRequest2.request.get(redirectPath!, { maxRedirects: 0 });
    expect(secondResponse.status()).toBe(307);
    expect(secondResponse.headers()["location"]).toBe("https://example.com/journey-c/second");
    await anonRequest2.close();
  });
});
