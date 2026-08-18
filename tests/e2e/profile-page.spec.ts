import { expect, test } from "@playwright/test";

const apiHeaders = {
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-credentials": "true",
  "content-type": "application/json",
};

const sessionCookie = {
  name: "maru_session",
  value: "test-session",
  domain: "127.0.0.1",
  path: "/",
} as const;

test("profile page loads profile data and supports updates", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/groups", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([]) });
  });

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "홍길동",
        birthday: "1995-10-08",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    });
  });

  await page.route("http://127.0.0.1:3001/profile", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "홍길동",
        birthday: "1995-10-08",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    });
  });

  await page.route("http://127.0.0.1:3001/profile/name", async (route) => {
    await expect(route.request().postDataJSON()).toEqual({ name: "김마루" });
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "김마루",
        birthday: "1995-10-08",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
      }),
    });
  });

  await page.route("http://127.0.0.1:3001/profile/birthday", async (route) => {
    await expect(route.request().postDataJSON()).toEqual({ birthday: "1999-01-01" });
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "김마루",
        birthday: "1999-01-01",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-15T00:00:00.000Z",
      }),
    });
  });

  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "내 프로필" })).toBeVisible();
  await expect(page.getByLabel("이메일")).toHaveValue("user@example.com");
  await expect(page.getByRole("button", { name: "이미지 변경 (준비 중)" })).toBeDisabled();

  await page.getByLabel("이름").fill("김마루");
  await page.getByLabel("생일").fill("1999-01-01");
  await page.getByRole("button", { name: "저장하기" }).click();

  await expect(page.getByRole("status")).toHaveText("프로필이 저장되었어요.");
});

test("profile update errors are surfaced to users", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/groups", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([]) });
  });

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "홍길동",
        birthday: "1995-10-08",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    });
  });

  await page.route("http://127.0.0.1:3001/profile", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "1",
        email: "user@example.com",
        name: "홍길동",
        birthday: "1995-10-08",
        profileImageKey: null,
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
      }),
    });
  });

  await page.route("http://127.0.0.1:3001/profile/name", async (route) => {
    await route.fulfill({
      status: 400,
      headers: apiHeaders,
      body: JSON.stringify({ message: "이름 형식이 올바르지 않습니다." }),
    });
  });

  await page.goto("/profile");
  await page.getByLabel("이름").fill(" ");
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("이름을 입력해주세요.")).toBeVisible();

  await page.getByLabel("이름").fill("김마루");
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("이름 형식이 올바르지 않습니다.")).toBeVisible();
});
