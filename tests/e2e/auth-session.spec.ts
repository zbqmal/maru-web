import { expect, test } from "@playwright/test";

const apiHeaders = {
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-credentials": "true",
  "content-type": "application/json",
};

test("unauthenticated users trying to open protected routes are redirected to login", async ({
  page,
}) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});

test("authenticated users are redirected away from auth pages and see their session menu", async ({
  context,
  page,
}) => {
  await context.addCookies([
    {
      name: "maru_session",
      value: "test-session",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "홍길동",
        birthday: null,
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/login");

  await expect(page).toHaveURL(/\/diary$/);
  await expect(page.getByRole("button", { name: "사용자 메뉴" })).toContainText("홍길동");

  await page.getByRole("button", { name: "사용자 메뉴" }).click();
  await expect(page.getByText("user@example.com")).toBeVisible();
});
