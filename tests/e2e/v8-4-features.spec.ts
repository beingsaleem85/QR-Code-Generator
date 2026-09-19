import { expect, test } from "@playwright/test";

test.describe("QRForge v8.4 Features Verification", () => {
  test("presets default to black, SS2/SS3 presets exist, and PDF privacy is streamlined", async ({ page }) => {
    await page.goto("/qr-generator");

    // 1. Check Presets in Gallery
    const presetsGallery = page.getByRole("radiogroup", { name: "QR design preset" });
    await expect(presetsGallery).toBeVisible();

    // Verify SS2 Micro Dots preset exists
    const microDotsPreset = page.getByRole("radio", { name: /Micro Dots/i });
    await expect(microDotsPreset).toBeVisible();

    // Verify SS3 Framed presets exist
    const scanBadgePreset = page.getByRole("radio", { name: /Scan Badge/i });
    await expect(scanBadgePreset).toBeVisible();

    const boxedFramePreset = page.getByRole("radio", { name: /Boxed Frame/i });
    await expect(boxedFramePreset).toBeVisible();

    const splitCardPreset = page.getByRole("radio", { name: /Split Card/i });
    await expect(splitCardPreset).toBeVisible();

    const posterStylePreset = page.getByRole("radio", { name: /Poster Style/i });
    await expect(posterStylePreset).toBeVisible();

    // 2. Verify Black Defaults on Presets
    const fgColorInput = page.locator("#color-foreground");
    await expect(fgColorInput).toHaveValue("#000000");

    // Click Micro Dots preset — verify foreground color remains #000000
    await microDotsPreset.click();
    await expect(fgColorInput).toHaveValue("#000000");

    // Click Scan Badge preset — verify frame style set and foreground remains #000000
    await scanBadgePreset.click();
    await expect(fgColorInput).toHaveValue("#000000");

    // 3. Switch to PDF QR Type
    const pdfOption = page.getByRole("option", { name: /PDF/i });
    await pdfOption.click();

    // Verify PDF form fields
    const pdfUpload = page.locator("#pdf-upload");
    await expect(pdfUpload).toBeVisible();

    // 4. Switch to Destination Preview tab
    const destinationTab = page.getByRole("button", { name: "Destination preview" });
    await expect(destinationTab).toBeVisible();
    await destinationTab.click();

    // Verify no blocking error in destination preview
    const destRegion = page.getByRole("region", { name: "Destination preview" });
    await expect(destRegion).toBeVisible();
    await expect(destRegion).toContainText("No PDF uploaded yet");
    await expect(page.locator("body")).not.toContainText("This content is blocked");
  });
});
