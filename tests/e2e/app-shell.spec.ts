import { expect, test } from "@playwright/test";

test("unauthenticated root redirects to login for the diary", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login\?next=%2Fdiary$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
