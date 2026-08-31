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

const me = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  birthday: null,
  profileImageKey: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

const invitation = {
  id: "inv-1",
  groupId: "g1",
  groupName: "우리 가족",
  invitedEmail: "alice@example.com",
  expiresAt: "2026-12-31T23:59:59.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const joinedGroup = {
  id: "g1",
  name: "우리 가족",
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
  memberships: [
    {
      id: "m1",
      userId: "u1",
      role: "MEMBER",
      createdAt: "2026-08-21T00:00:00.000Z",
      updatedAt: "2026-08-21T00:00:00.000Z",
      user: { id: "u1", name: "Alice", profileImageKey: null },
    },
  ],
};

test("unauthenticated user with valid invite is redirected to login and can return to accept", async ({
  page,
}) => {
  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 401, headers: apiHeaders, body: JSON.stringify({}) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(invitation) });
  });

  await page.goto("/invitations/accept?token=valid-token-123");

  // Should be redirected to login preserving the next param
  await expect(page).toHaveURL(/\/login\?next=.*invitations%2Faccept.*token/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});

test("authenticated user sees invitation card and can accept", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(invitation) });
  });

  let acceptCalled = false;
  await page.route("http://127.0.0.1:3001/group-invitations/accept", async (route) => {
    acceptCalled = true;
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(joinedGroup) });
  });

  await page.route("http://127.0.0.1:3001/groups", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([joinedGroup]) });
  });

  await page.goto("/invitations/accept?token=valid-token-123");

  // Invitation card
  await expect(page.getByText("우리 가족").first()).toBeVisible();
  await expect(page.getByText(/alice@example\.com/)).toBeVisible();
  await expect(page.getByRole("button", { name: "그룹 참가하기" })).toBeEnabled();

  // Accept
  await page.getByRole("button", { name: "그룹 참가하기" }).click();

  await expect(page).toHaveURL(/\/diary\?group=g1$/);
  expect(acceptCalled).toBe(true);
});

test("shows not-found state for invalid (404) invite token", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({
      status: 404,
      headers: apiHeaders,
      body: JSON.stringify({ message: "Not found" }),
    });
  });

  await page.goto("/invitations/accept?token=bad-token");

  await expect(page.getByText("초대 링크를 찾을 수 없어요")).toBeVisible();
});

test("shows expired state for 410 invite token", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({
      status: 410,
      headers: apiHeaders,
      body: JSON.stringify({ message: "Gone" }),
    });
  });

  await page.goto("/invitations/accept?token=expired-token");

  await expect(page.getByText("초대 링크가 만료되었어요")).toBeVisible();
});

test("shows already-used state for 409 invite token", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({
      status: 409,
      headers: apiHeaders,
      body: JSON.stringify({ message: "Conflict" }),
    });
  });

  await page.goto("/invitations/accept?token=used-token");

  await expect(page.getByText("이미 사용된 초대 링크예요")).toBeVisible();
  await expect(page.getByRole("link", { name: "로그인하기" })).toBeVisible();
});

test("shows invalid-link message when token is missing from URL", async ({ page }) => {
  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 401, headers: apiHeaders, body: JSON.stringify({}) });
  });

  await page.goto("/invitations/accept");

  await expect(page.getByText("초대 링크가 올바르지 않아요")).toBeVisible();
});

test("shows MARU branding on all invitation page states", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(me) });
  });

  await page.route("http://127.0.0.1:3001/group-invitations/validate*", async (route) => {
    await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(invitation) });
  });

  await page.goto("/invitations/accept?token=valid-token-123");

  await expect(page.getByText("MARU").first()).toBeVisible();
});
