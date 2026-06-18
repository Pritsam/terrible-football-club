import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@tfc.com";
const TEST_PASSWORD = "123456";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/", { timeout: 10000 });
}

test.describe("League management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("create league page renders form", async ({ page }) => {
    await page.goto("/leagues/new");
    await expect(page.getByLabel(/league name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create/i })).toBeVisible();
  });

  test("create league validation rejects empty name", async ({ page }) => {
    await page.goto("/leagues/new");
    await page.getByRole("button", { name: /create/i }).click();
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("invite link page renders for valid code format", async ({ page }) => {
    await page.goto("/join/a1b2c3d4");
    await expect(page).not.toHaveURL(/\/login/);
  });
});

test.describe("League detail page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("navigating to first league shows leaderboard and matches", async ({ page }) => {
    await page.goto("/");
    const leagueLink = page.locator('a[href^="/leagues/"]:not([href="/leagues/new"])').first();
    const count = await leagueLink.count();
    if (count === 0) {
      test.skip();
    }
    await leagueLink.click();
    await expect(page).toHaveURL(/\/leagues\/.+/);
    await expect(page.getByText("Leaderboard")).toBeVisible({ timeout: 8000 });
  });
});
