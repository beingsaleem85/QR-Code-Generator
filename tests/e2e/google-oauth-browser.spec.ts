import { test, expect } from "@playwright/test";

test.describe("Google OAuth Local Browser Verification", () => {
  test("1. Login Page UI elements: Google button, icon, divider, and email form", async ({ page }) => {
    await page.goto("/login");

    // 1. Google Button is visible and contains Google icon
    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();

    const googleSvg = googleBtn.locator("svg");
    await expect(googleSvg).toBeVisible();

    // 2. Divider is rendered
    await expect(page.getByText(/or continue with email/i)).toBeVisible();

    // 3. Email & Password fields are functional
    const emailInput = page.getByLabel("Email");
    const passwordInput = page.locator("input#password");
    const loginBtn = page.getByRole("button", { name: "Log in" });
    const rememberMe = page.getByRole("checkbox", { name: "Remember me" });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginBtn).toBeVisible();
    await expect(rememberMe).toBeVisible();
    await expect(rememberMe).toBeChecked();

    // Toggle Remember me
    await rememberMe.click();
    await expect(rememberMe).not.toBeChecked();
    await rememberMe.click();
    await expect(rememberMe).toBeChecked();
  });

  test("2. Signup Page UI elements: Google button and divider", async ({ page }) => {
    await page.goto("/signup");

    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();

    await expect(page.getByText(/or continue with email/i)).toBeVisible();

    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("input#password")).toBeVisible();
    await expect(page.locator("input#confirmPassword")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  });

  test("3. Google Button initiates OAuth redirect request to Supabase with provider google", async ({ page }) => {
    await page.goto("/login");

    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await expect(googleBtn).toBeVisible();

    // Click Google button and verify OAuth authorize request
    await Promise.all([
      page.waitForRequest((req) => req.url().includes("supabase.co/auth/v1/authorize")),
      googleBtn.click(),
    ]);
  });

  test("4. Complete OAuth flow navigates to Google Accounts sign-in consent screen", async ({ page }) => {
    await page.goto("/login");

    const googleBtn = page.getByRole("button", { name: /continue with google/i });
    await googleBtn.click();

    // Wait for the browser to navigate to accounts.google.com
    await page.waitForURL(
      (url) => url.hostname.includes("accounts.google.com"),
      { timeout: 15000 },
    );

    const targetUrl = page.url();
    expect(targetUrl).toContain("accounts.google.com");
    expect(targetUrl).toContain("client_id=");
    expect(targetUrl).toContain("emhsdqfqzdcuexvhweiz.supabase.co");
  });

  test("5. OAuth cancellation error handling on Login page", async ({ page }) => {
    // Simulate user cancelling Google authorization dialog
    await page.goto("/auth/callback?error=access_denied&error_description=User+denied+access");

    // Should redirect to /login?error=access_denied
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("error") === "access_denied", {
      timeout: 5000,
    });

    // Alert message displayed clearly
    const alert = page.getByText("Sign in with Google was cancelled.");
    await expect(alert).toBeVisible();
  });

  test("6. OAuth generic failure error handling on Login page", async ({ page }) => {
    // Simulate generic OAuth error
    await page.goto("/auth/callback?error=server_error");

    // Should redirect to /login?error=oauth_failed
    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("error") === "oauth_failed", {
      timeout: 5000,
    });

    const alert = page.getByText("Unable to sign in with Google. Please try again.");
    await expect(alert).toBeVisible();
  });

  test("7. Callback opened without code or token_hash redirects safely to login", async ({ page }) => {
    await page.goto("/auth/callback");

    await page.waitForURL((url) => url.pathname === "/login" && url.searchParams.get("error") === "oauth_failed", {
      timeout: 5000,
    });

    await expect(page.getByText("Unable to sign in with Google. Please try again.")).toBeVisible();
  });

  test("8. Existing email/password login remains unaffected", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("nonexistent@example.com");
    await page.locator("input#password").fill("wrongpassword123");
    await page.getByRole("button", { name: "Log in" }).click();

    // Form shows error alert for bad credentials without crashing
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
  });

  test("9. Open-redirect protection: external and protocol-relative URLs rejected", async ({ request }) => {
    // Test open-redirect bypass attempts via direct GET to callback
    const resExternal = await request.get("/auth/callback?error=access_denied&next=https://attacker.com", {
      maxRedirects: 0,
    });
    expect(resExternal.status()).toBe(307);
    const locExternal = resExternal.headers()["location"];
    expect(locExternal).not.toContain("attacker.com");
    expect(locExternal).toContain("/login?error=access_denied");

    const resProto = await request.get("/auth/callback?error=access_denied&next=//attacker.com", {
      maxRedirects: 0,
    });
    expect(resProto.status()).toBe(307);
    const locProto = resProto.headers()["location"];
    expect(locProto).not.toContain("attacker.com");
    expect(locProto).toContain("/login?error=access_denied");
  });
});
