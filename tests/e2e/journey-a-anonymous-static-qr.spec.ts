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

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PNG" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/-qr\.png$/);
  });
});
