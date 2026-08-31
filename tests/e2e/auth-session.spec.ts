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

  await expect(page).toHaveURL(/\/login\?next=%2Fprofile$/);
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

  await page.route("http://127.0.0.1:3001/groups", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify([
        {
          id: "g1",
          name: "우리 가족",
          createdAt: "2026-08-14T00:00:00.000Z",
          updatedAt: "2026-08-14T00:00:00.000Z",
          memberships: [
            {
              id: "m1",
              userId: "1",
              role: "LEADER",
              createdAt: "2026-08-14T00:00:00.000Z",
              updatedAt: "2026-08-14T00:00:00.000Z",
              user: {
                id: "1",
                name: "홍길동",
                profileImageKey: null,
              },
            },
            {
              id: "m2",
              userId: "2",
              role: "MEMBER",
              createdAt: "2026-08-14T00:00:00.000Z",
              updatedAt: "2026-08-14T00:00:00.000Z",
              user: {
                id: "2",
                name: "다연",
                profileImageKey: null,
              },
            },
          ],
        },
      ]),
    });
  });

  await page.goto("/login");

  await expect(page).toHaveURL(/\/diary$/);
  await expect(page.getByRole("button", { name: "사용자 메뉴" })).toContainText("홍길동");
  await expect(page.getByRole("button", { name: "그룹 선택" })).toContainText("우리 가족");
  await expect(page.getByText("멤버 2명", { exact: true })).toBeVisible();
  await expect(page.getByText("홍길동 (나)")).toBeVisible();
  await expect(page.getByText("다연")).toBeVisible();
  await expect(page.getByLabel("그룹 리더")).toBeVisible();

  await page.getByRole("button", { name: "사용자 메뉴" }).click();
  await expect(page.getByText("user@example.com")).toBeVisible();
});
