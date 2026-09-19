import { test, expect } from "@playwright/test";

test.describe("Guest Save QR Redirect and Draft Stash", () => {
  test("guest clicking Save QR preserves draft in sessionStorage and redirects to login with redirectTo", async ({
    page,
  }) => {
    // 1. Visit the builder page as an unauthenticated guest
    await page.goto("/qr-generator");

    // Fill in a name for the QR code
    const nameInput = page.getByPlaceholder("My QR code");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Guest Test QR");

    // Fill in a recognizable custom URL
    const urlInput = page.getByPlaceholder("https://example.com");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("https://test-guest-preserve.com");

    // Click "Save QR"
    const saveButton = page.getByRole("button", { name: "Save QR" });
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Verify redirected to login with redirectTo param
    await page.waitForURL(/\/login\?redirectTo=/);
    expect(page.url()).toContain("redirectTo=%2Fdashboard%2Fqr-codes%2Fnew");

    // Verify the draft was stored in sessionStorage
    const storedDraft = await page.evaluate(() => {
      return sessionStorage.getItem("qr-generator-draft");
    });
    expect(storedDraft).toBeTruthy();
    const parsedDraft = JSON.parse(storedDraft as string);
    expect(parsedDraft.content.url).toBe("https://test-guest-preserve.com");

    // Verify "Sign up" link on login page forwards the redirectTo param
    const signupLink = page.getByRole("link", { name: /Sign up/i });
    await expect(signupLink).toHaveAttribute(
      "href",
      "/signup?redirectTo=%2Fdashboard%2Fqr-codes%2Fnew"
    );

    // Verify copy on login page when redirected
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sign in to continue");
    await expect(
      page.getByText("Create a free account or sign in to generate, download, and manage your QR codes.")
    ).toBeVisible();
  });

  test("guest clicking Generate QR preserves draft in sessionStorage and redirects to login", async ({
    page,
  }) => {
    await page.goto("/qr-generator");

    const nameInput = page.getByPlaceholder("My QR code");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Guest Generate Test");

    const urlInput = page.getByPlaceholder("https://example.com");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("https://test-guest-generate.com");

    // Click "Generate QR" button
    const generateBtn = page.getByRole("button", { name: "Generate QR" }).first();
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();

    await page.waitForURL(/\/login\?redirectTo=/);
    expect(page.url()).toContain("redirectTo=%2Fdashboard%2Fqr-codes%2Fnew");

    const storedDraft = await page.evaluate(() => sessionStorage.getItem("qr-generator-draft"));
    expect(storedDraft).toBeTruthy();
    const parsed = JSON.parse(storedDraft as string);
    expect(parsed.content.url).toBe("https://test-guest-generate.com");
  });

  test("guest clicking Download PNG preserves draft in sessionStorage and redirects to login without downloading", async ({
    page,
  }) => {
    await page.goto("/qr-generator");

    const nameInput = page.getByPlaceholder("My QR code");
    await expect(nameInput).toBeVisible();
    await nameInput.fill("Guest Download Test");

    const urlInput = page.getByPlaceholder("https://example.com");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("https://test-guest-download.com");

    let downloadTriggered = false;
    page.on("download", () => {
      downloadTriggered = true;
    });

    // Click "Download PNG" button
    const downloadBtn = page.getByRole("button", { name: "Download PNG" });
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();

    await page.waitForURL(/\/login\?redirectTo=/);
    expect(page.url()).toContain("redirectTo=%2Fdashboard%2Fqr-codes%2Fnew");
    expect(downloadTriggered).toBe(false);

    const storedDraft = await page.evaluate(() => sessionStorage.getItem("qr-generator-draft"));
    expect(storedDraft).toBeTruthy();
    const parsed = JSON.parse(storedDraft as string);
    expect(parsed.content.url).toBe("https://test-guest-download.com");
  });

  test("sanitizes open-redirect attempts on login and signup links", async ({ page }) => {
    // Visit login with external URL
    await page.goto("/login?redirectTo=https://attacker.com/steal");
    const signupLink = page.getByRole("link", { name: /Sign up/i });
    // Must fall back to safe /dashboard or not contain attacker.com
    const href = await signupLink.getAttribute("href");
    expect(href).not.toContain("attacker.com");

    // Visit login with protocol-relative URL
    await page.goto("/login?redirectTo=//attacker.com/steal");
    const signupLinkProto = page.getByRole("link", { name: /Sign up/i });
    const hrefProto = await signupLinkProto.getAttribute("href");
    expect(hrefProto).not.toContain("attacker.com");
  });

  test("zero-render security: guest typing secret URL never produces real QR in DOM, SVG, canvas, or img", async ({
    page,
  }) => {
    await page.goto("/qr-generator");

    const urlInput = page.getByPlaceholder("https://example.com");
    await expect(urlInput).toBeVisible();
    await urlInput.fill("https://example-secret-test.com");

    // Wait long enough that debounce would have executed if rendering were enabled
    await page.waitForTimeout(600);

    // 1. Inspect DOM: No QR code preview container with real QR exists
    const qrPreviewImg = page.locator('div[role="img"][aria-label="QR code preview"]');
    await expect(qrPreviewImg).not.toBeAttached();

    // 2. Inspect canvas: No canvas element exists in DOM
    const canvasCount = await page.locator("canvas").count();
    expect(canvasCount).toBe(0);

    // 3. Inspect img elements: No image tag has a QR data URL or secret url
    const imgs = await page.locator("img").all();
    for (const img of imgs) {
      const src = await img.getAttribute("src");
      expect(src).not.toContain("example-secret-test.com");
      expect(src).not.toContain("data:image/png");
    }

    // 4. Inspect SVGs in the preview area: only non-functional decorative placeholder exists
    const placeholderText = page.getByText("Sign in to continue");
    await expect(placeholderText).toBeVisible();

    const subtitleText = page.getByText(
      "Create a free account or sign in to generate, download, and manage your QR codes."
    );
    await expect(subtitleText).toBeVisible();

    const generateCta = page.getByRole("button", { name: "Generate QR" }).first();
    await expect(generateCta).toBeVisible();

    // Verify page HTML does not contain the secret URL anywhere in rendered DOM/SVG/scripts
    const pageHtml = await page.content();
    expect(pageHtml).not.toContain("example-secret-test.com");

    // The secret url exists strictly in the client input field property
    expect(await urlInput.inputValue()).toBe("https://example-secret-test.com");
  });
});
