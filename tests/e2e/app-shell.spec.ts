import { expect, test } from "@playwright/test";

test("unauthenticated home redirects to login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
