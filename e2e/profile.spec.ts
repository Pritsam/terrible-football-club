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

test.describe("Profile page", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("header shows profile link with user name", async ({ page }) => {
    await expect(page.getByRole("link", { name: /your profile/i })).toBeVisible();
  });

  test("profile page renders with pre-filled fields", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: /your profile/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /display name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /avatar url/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeDisabled();
  });

  test("email field is read-only", async ({ page }) => {
    await page.goto("/profile");
    const emailInput = page.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeDisabled();
    await expect(emailInput).toHaveValue(TEST_EMAIL);
  });

  test("saving a valid name shows success message", async ({ page }) => {
    await page.goto("/profile");
    const nameInput = page.getByRole("textbox", { name: /display name/i });
    const currentName = await nameInput.inputValue();

    await nameInput.fill("Renamed Player");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });

    await nameInput.fill(currentName || TEST_EMAIL.split("@")[0]);
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });
  });

  test("empty name shows validation error", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("textbox", { name: /display name/i }).fill("");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
  });

  test("invalid avatar URL shows validation error", async ({ page }) => {
    await page.goto("/profile");
    await page.getByRole("textbox", { name: /avatar url/i }).fill("not-a-url");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText("Must be a valid URL")).toBeVisible();
  });

  test("profile link in header navigates to profile page", async ({ page }) => {
    await page.getByRole("link", { name: /your profile/i }).click();
    await expect(page).toHaveURL("/profile");
  });

});

test.describe("Profile page — unauthenticated", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("unauthenticated access redirects to login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
