import { test, expect, type Response } from "@playwright/test";

const TEST_EMAIL = "test@tfc.com";
const TEST_PASSWORD = "123456";

test.describe("Authentication", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup page renders form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByText("Create your account")).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("signup with empty fields shows validation errors", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText("Name is required")).toBeVisible({ timeout: 3000 });
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test("login with valid credentials redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/", { timeout: 10000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill("wrong@example.com");
    await page.locator("#password").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 5000 });
  });

  test("unauthenticated user is redirected to login from dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("logout signs user out and redirects to login", async ({ page }) => {
    await page.goto("/login");
    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/", { timeout: 10000 });

    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });

  test("Google OAuth button initiates PKCE flow via route handler", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();

    // Capture the /api/auth/google response before the browser follows the redirect chain
    let oauthRouteResponse: Response | null = null;
    page.on("response", (response) => {
      if (response.url().includes("/api/auth/google")) {
        oauthRouteResponse = response;
      }
    });

    // Click and wait for navigation away from the login page toward Google OAuth
    await Promise.all([
      page.waitForURL(
        (url) =>
          url.hostname.includes("accounts.google.com") ||
          url.hostname.includes("supabase.co"),
        { timeout: 10000 },
      ),
      page.getByRole("button", { name: /continue with google/i }).click(),
    ]);

    // Route handler must have responded with a redirect (307)
    expect(oauthRouteResponse).not.toBeNull();
    expect((oauthRouteResponse as Response).status()).toBe(307);

    // The PKCE code verifier cookie must be set so the callback can exchange the code
    const cookies = await page.context().cookies();
    const pkceVerifierCookie = cookies.find((c) =>
      c.name.includes("auth-token-code-verifier"),
    );
    expect(pkceVerifierCookie).toBeDefined();
    expect(pkceVerifierCookie?.value).toBeTruthy();

    // The redirect destination must be Google's OAuth endpoint (via Supabase)
    expect(page.url()).toContain("accounts.google.com");
  });
});
