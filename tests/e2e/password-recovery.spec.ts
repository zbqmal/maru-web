import { expect, test } from "@playwright/test";

const apiHeaders = {
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-credentials": "true",
  "content-type": "application/json",
};

test.describe("Forgot Password flow", () => {
  test("user can request a password reset and sees neutral success message", async ({ page }) => {
    await page.route("http://127.0.0.1:3001/forgot-password", async (route) => {
      await route.fulfill({ status: 204, headers: apiHeaders, body: "" });
    });

    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "비밀번호 찾기" })).toBeVisible();

    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByRole("button", { name: "재설정 링크 보내기" }).click();

    await expect(page.getByRole("heading", { name: "이메일을 확인해주세요" })).toBeVisible();
    await expect(page.getByText(/비밀번호 재설정 안내를 보내드렸습니다/)).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인으로 돌아가기" })).toBeVisible();
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.getByLabel("이메일").fill("notanemail");
    await page.getByRole("button", { name: "재설정 링크 보내기" }).click();
    await expect(page.getByText("올바른 이메일 형식이 아닙니다.")).toBeVisible();
  });

  test("shows server error on API failure", async ({ page }) => {
    await page.route("http://127.0.0.1:3001/forgot-password", async (route) => {
      await route.fulfill({
        status: 500,
        headers: apiHeaders,
        body: JSON.stringify({ message: "서버 오류가 발생했습니다." }),
      });
    });

    await page.goto("/forgot-password");
    await page.getByLabel("이메일").fill("user@example.com");
    await page.getByRole("button", { name: "재설정 링크 보내기" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "서버 오류가 발생했습니다." })
    ).toBeVisible();
  });

  test("login page has link to forgot-password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });
});

test.describe("Reset Password flow", () => {
  test("shows invalid link when no token in URL", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByRole("heading", { name: "유효하지 않은 링크" })).toBeVisible();
    await expect(page.getByRole("link", { name: "비밀번호 재설정 다시 요청하기" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  test("user can reset password with valid token and is directed to login", async ({ page }) => {
    await page.route("http://127.0.0.1:3001/reset-password", async (route) => {
      await route.fulfill({ status: 204, headers: apiHeaders, body: "" });
    });

    await page.goto("/reset-password?token=valid-token-123");
    await expect(page.getByRole("heading", { name: "새 비밀번호 설정" })).toBeVisible();

    await page.getByLabel("새 비밀번호").fill("NewStr0ng!");
    await page.getByRole("button", { name: "비밀번호 변경" }).click();

    await expect(page.getByRole("heading", { name: "비밀번호가 변경되었습니다" })).toBeVisible();
    await expect(page.getByRole("link", { name: "로그인하기" })).toHaveAttribute("href", "/login");
  });

  test("shows expired token state when API returns 400", async ({ page }) => {
    await page.route("http://127.0.0.1:3001/reset-password", async (route) => {
      await route.fulfill({
        status: 400,
        headers: apiHeaders,
        body: JSON.stringify({ message: "Invalid or expired token" }),
      });
    });

    await page.goto("/reset-password?token=expired-token");
    await page.getByLabel("새 비밀번호").fill("NewStr0ng!");
    await page.getByRole("button", { name: "비밀번호 변경" }).click();

    await expect(page.getByRole("heading", { name: "링크가 만료되었습니다" })).toBeVisible();
    await expect(page.getByRole("link", { name: "비밀번호 재설정 다시 요청하기" })).toHaveAttribute(
      "href",
      "/forgot-password"
    );
  });

  test("shows validation errors for weak password", async ({ page }) => {
    await page.goto("/reset-password?token=valid-token");
    await page.getByLabel("새 비밀번호").fill("weak");
    await page.getByRole("button", { name: "비밀번호 변경" }).click();
    await expect(page.getByText("비밀번호는 8자 이상이어야 합니다.")).toBeVisible();
  });
});
