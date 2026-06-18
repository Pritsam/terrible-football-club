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

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("renders My Leagues section", async ({ page }) => {
    await expect(page.getByText(/my leagues/i)).toBeVisible();
  });

  test("renders Create League option", async ({ page }) => {
    await expect(page.getByRole("link", { name: /new league/i })).toBeVisible();
  });

  test("renders Join a League card", async ({ page }) => {
    await expect(page.getByText(/join a league/i)).toBeVisible();
  });

  test("shows sign out button in header", async ({ page }) => {
    await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  });

  test("join league with invalid code shows error", async ({ page }) => {
    const input = page.getByRole("textbox", { name: /invite code/i });
    await input.fill("xxxxxxxx");
    await page.getByRole("button", { name: /join league/i }).click();
    await expect(page.getByText("Invalid invite code format")).toBeVisible({ timeout: 5000 });
  });
});
