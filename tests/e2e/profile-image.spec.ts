import { expect, test } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3001";
const imageBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP5sAAAAASUVORK5CYII=",
  "base64"
);
const headers = {
  "access-control-allow-origin": "http://127.0.0.1:3000",
  "access-control-allow-credentials": "true",
  "access-control-allow-methods": "GET, POST, PATCH, DELETE, PUT, OPTIONS",
  "access-control-allow-headers": "content-type",
};

test("profile image previews, uploads, replaces, persists across navigation and removes", async ({
  context,
  page,
}) => {
  await context.addCookies([
    { name: "maru_session", value: "test-session", domain: "127.0.0.1", path: "/" },
  ]);
  let profileImageKey: string | null = null;
  let uploads = 0;
  let binaryUploads = 0;
  let failBinary = true;
  const profile = () => ({
    id: "1",
    name: "마루",
    email: "user@example.com",
    birthday: null,
    profileImageKey,
    createdAt: "2026-10-14T00:00:00.000Z",
    updatedAt: "2026-10-14T00:00:00.000Z",
  });

  await page.route(`${apiUrl}/**`, async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
    } else if (path === "/groups") {
      await route.fulfill({ status: 200, headers, json: [] });
    } else if (path === "/profile/image/upload-url") {
      expect(request.method()).toBe("POST");
      expect(request.postDataJSON()).toEqual({
        mimeType: "image/png",
        sizeBytes: imageBytes.length,
      });
      uploads++;
      await route.fulfill({
        status: 201,
        headers,
        json: {
          uploadUrl: `${apiUrl}/test-upload/${uploads}`,
          storageKey: `profiles/1/image-${uploads}.png`,
        },
      });
    } else if (path.startsWith("/test-upload/")) {
      binaryUploads++;
      expect(request.method()).toBe("PUT");
      expect(request.headers()["content-type"]).toBe("image/png");
      expect(request.headers()["cookie"]).toBeUndefined();
      expect(request.postDataBuffer()).toEqual(imageBytes);
      await route.fulfill({ status: failBinary ? 403 : 200, headers });
      failBinary = false;
    } else if (path === "/profile/image") {
      if (request.method() === "DELETE") {
        profileImageKey = null;
        await route.fulfill({ status: 204, headers });
      } else {
        expect(request.method()).toBe("PATCH");
        expect(request.postDataJSON()).toEqual({
          storageKey: `profiles/1/image-${uploads}.png`,
          mimeType: "image/png",
        });
        profileImageKey = request.postDataJSON().storageKey;
        await route.fulfill({ status: 200, headers, json: profile() });
      }
    } else if (path.startsWith("/media/")) {
      await route.fulfill({ status: 200, headers, contentType: "image/png", body: imageBytes });
    } else if (path === "/profile" || path === "/me") {
      await route.fulfill({ status: 200, headers, json: profile() });
    } else {
      await route.fulfill({ status: 404, headers, json: { message: "Not found" } });
    }
  });

  await page.goto("/profile");
  const section = page.getByRole("region", { name: "프로필 이미지", exact: true });
  const input = page.getByLabel("프로필 이미지 파일 선택");
  const file = { name: "profile.png", mimeType: "image/png", buffer: imageBytes };
  await input.setInputFiles(file);
  await expect(section.locator("img")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "선택 취소" }).click();
  expect(uploads).toBe(0);
  await input.setInputFiles(file);
  await page.getByRole("button", { name: "이미지 저장" }).click();
  await expect(section.getByRole("alert")).toHaveText("사진 업로드에 실패했어요.");
  expect(profileImageKey).toBeNull();
  await expect(section.locator("img")).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: "이미지 저장" }).click();
  await expect(section.getByRole("status")).toHaveText("프로필 이미지가 저장되었어요.");
  await expect(section.locator("img")).toHaveAttribute(
    "src",
    `${apiUrl}/media/profiles/1/image-2.png`
  );
  const menuAvatar = page.getByRole("button", { name: "사용자 메뉴" }).locator("img");
  await expect(menuAvatar).toHaveAttribute("src", `${apiUrl}/media/profiles/1/image-2.png`);
  await input.setInputFiles(file);
  await page.getByRole("button", { name: "이미지 저장" }).click();
  await expect(section.locator("img")).toHaveAttribute(
    "src",
    `${apiUrl}/media/profiles/1/image-3.png`
  );
  expect(binaryUploads).toBe(3);
  await page.getByRole("link", { name: "오늘의 다이어리" }).click();
  await expect(menuAvatar).toHaveAttribute("src", `${apiUrl}/media/profiles/1/image-3.png`);
  await page.getByRole("button", { name: "사용자 메뉴" }).click();
  await page.getByRole("link", { name: "프로필", exact: true }).click();
  await expect(section.locator("img")).toHaveAttribute(
    "src",
    `${apiUrl}/media/profiles/1/image-3.png`
  );
  await page.reload();
  await expect(section.locator("img")).toHaveAttribute(
    "src",
    `${apiUrl}/media/profiles/1/image-3.png`
  );
  await page.getByRole("button", { name: "이미지 삭제" }).click();
  await page.getByRole("button", { name: "취소", exact: true }).click();
  expect(profileImageKey).not.toBeNull();
  await page.getByRole("button", { name: "이미지 삭제" }).click();
  await page.getByRole("button", { name: "삭제 확인" }).click();
  await expect(section.getByRole("status")).toHaveText("프로필 이미지가 삭제되었어요.");
  await expect(section.locator("img")).toHaveCount(0);
  await expect(menuAvatar).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "이미지 삭제" })).toHaveCount(0);
});

test("profile image validation is accessible on a narrow screen", async ({ context, page }) => {
  await context.addCookies([
    { name: "maru_session", value: "test-session", domain: "127.0.0.1", path: "/" },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route(`${apiUrl}/**`, (route) =>
    route.fulfill({
      headers,
      json:
        new URL(route.request().url()).pathname === "/groups"
          ? []
          : {
              id: "1",
              name: "마루",
              email: "user@example.com",
              birthday: null,
              profileImageKey: null,
              createdAt: "2026-10-14T00:00:00.000Z",
              updatedAt: "2026-10-14T00:00:00.000Z",
            },
    })
  );
  await page.goto("/profile");
  const section = page.getByRole("region", { name: "프로필 이미지", exact: true });
  await page
    .getByLabel("프로필 이미지 파일 선택")
    .setInputFiles({ name: "invalid.gif", mimeType: "image/gif", buffer: imageBytes });
  await expect(section.getByRole("alert")).toHaveText(
    "JPG, PNG, WEBP 형식의 이미지만 선택할 수 있어요."
  );
  await expect(page.getByRole("button", { name: "이미지 저장" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "이미지 변경" })).toBeEnabled();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "이미지 변경" }).press("Enter"),
  ]);
  await chooser.setFiles({ name: "valid.png", mimeType: "image/png", buffer: imageBytes });
  await expect(page.getByRole("button", { name: "이미지 저장" })).toBeVisible();
  await expect(section.getByRole("alert")).toHaveCount(0);
});
