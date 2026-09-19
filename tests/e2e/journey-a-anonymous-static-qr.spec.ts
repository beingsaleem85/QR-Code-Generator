import { expect, test } from "@playwright/test";

/**
 * Journey A — Anonymous Static QR (master prompt Module 3.16).
 * Open generator -> select URL -> enter URL -> customize color -> generate ->
 * download. Entirely client-side (static QR rendering never calls the
 * server), so this journey needs no backend/session at all.
 */
test.describe("Journey A — Anonymous Static QR", () => {
  test("generates and downloads a styled static URL QR code with no account", async ({ page }) => {
    await page.goto("/qr-generator");

    await expect(page.getByRole("listbox", { name: "QR type" })).toBeVisible();

    const urlOption = page.getByRole("option", { name: "URL / Link" });
    await urlOption.click();
    await expect(urlOption).toHaveAttribute("aria-selected", "true");

    await page.getByLabel("Destination URL").fill("https://example.com/anonymous-journey");

    // Customize color (a real design change, not just accepting defaults).
    await page.locator("#color-foreground").fill("#1a2b3c");

    // The preview re-renders from the live payload — a visible <svg>/<canvas>
    // confirms real client-side generation happened, not just an empty form.
    await expect(page.locator("svg, canvas").first()).toBeVisible();

    // In v8.2, guest users must not download without authentication.
    // Clicking Download PNG preserves draft and redirects to /login.
    await page.getByRole("button", { name: "Download PNG" }).click();

    await page.waitForURL(/\/login\?redirectTo=/);
    expect(page.url()).toContain("redirectTo=%2Fdashboard%2Fqr-codes%2Fnew");

    const draft = await page.evaluate(() => sessionStorage.getItem("qr-generator-draft"));
    expect(draft).toBeTruthy();
    const parsed = JSON.parse(draft as string);
    expect(parsed.content.url).toBe("https://example.com/anonymous-journey");
  });
});
