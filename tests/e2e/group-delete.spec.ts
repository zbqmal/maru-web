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

test("leader can delete a group after exact name confirmation", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  const me = {
    id: "u1",
    email: "leader@example.com",
    name: "리더",
    birthday: null,
    profileImageKey: null,
    createdAt: "2026-08-14T00:00:00.000Z",
    updatedAt: "2026-08-14T00:00:00.000Z",
  };

  let groups = [
    {
      id: "g1",
      name: "우리 가족",
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
      memberships: [
        {
          id: "m1",
          userId: "u1",
          role: "LEADER",
          createdAt: "2026-08-14T00:00:00.000Z",
          updatedAt: "2026-08-14T00:00:00.000Z",
          user: { id: "u1", name: "리더", profileImageKey: null },
        },
      ],
    },
    {
      id: "g2",
      name: "친구들",
      createdAt: "2026-08-15T00:00:00.000Z",
      updatedAt: "2026-08-15T00:00:00.000Z",
      memberships: [
        {
          id: "m2",
          userId: "u1",
          role: "MEMBER",
          createdAt: "2026-08-15T00:00:00.000Z",
          updatedAt: "2026-08-15T00:00:00.000Z",
          user: { id: "u1", name: "리더", profileImageKey: null },
        },
      ],
    },
  ];

  let isDeleteRequested = false;

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/groups", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(groups) });
  });

  await page.route("http://127.0.0.1:3001/groups/g1", async (route) => {
    if (route.request().method() !== "DELETE") {
      await route.fallback();
      return;
    }

    isDeleteRequested = true;
    groups = groups.filter((group) => group.id !== "g1");
    await route.fulfill({ status: 204, headers: apiHeaders });
  });

  await page.goto("/home");
  await page.getByRole("button", { name: "그룹 선택" }).click();
  await page.getByRole("button", { name: "그룹 삭제" }).click();

  await expect(page.getByRole("heading", { name: "그룹 삭제" })).toBeVisible();
  const confirmationInput = page.getByLabel("그룹 이름 확인");
  const submitButton = page.getByRole("button", { name: "그룹 삭제" });

  await expect(submitButton).toBeDisabled();
  await confirmationInput.fill("우리");
  await expect(submitButton).toBeDisabled();
  await confirmationInput.fill("우리 가족");
  await submitButton.click();

  await expect(page.getByRole("heading", { name: "그룹 삭제" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "그룹 선택" })).toContainText("친구들");
  expect(isDeleteRequested).toBeTruthy();
});

test("non-leader does not see delete group action", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "u2",
        email: "member@example.com",
        name: "멤버",
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
              userId: "u1",
              role: "LEADER",
              createdAt: "2026-08-14T00:00:00.000Z",
              updatedAt: "2026-08-14T00:00:00.000Z",
              user: { id: "u1", name: "리더", profileImageKey: null },
            },
            {
              id: "m2",
              userId: "u2",
              role: "MEMBER",
              createdAt: "2026-08-14T00:00:00.000Z",
              updatedAt: "2026-08-14T00:00:00.000Z",
              user: { id: "u2", name: "멤버", profileImageKey: null },
            },
          ],
        },
      ]),
    });
  });

  await page.goto("/home");
  await page.getByRole("button", { name: "그룹 선택" }).click();
  await expect(page.getByRole("button", { name: "그룹 삭제" })).toHaveCount(0);
});
