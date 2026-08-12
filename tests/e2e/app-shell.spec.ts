import { expect, test } from "@playwright/test";

test("home redirects to diary page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/diary$/);
  await expect(page.getByRole("heading", { name: "오늘의 다이어리" })).toBeVisible();
});
