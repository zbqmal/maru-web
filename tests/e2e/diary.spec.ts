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

const user = {
  id: "u1",
  email: "leader@example.com",
  name: "리더",
  birthday: null,
  profileImageKey: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const group = {
  id: "g1",
  name: "우리 가족",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  memberships: [
    {
      id: "m1",
      userId: "u1",
      role: "LEADER",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      user: { id: "u1", name: "리더", profileImageKey: null },
    },
    {
      id: "m2",
      userId: "u2",
      role: "MEMBER",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      user: { id: "u2", name: "멤버", profileImageKey: null },
    },
  ],
};

const apiHostPattern = "(127\\.0\\.0\\.1|localhost)";

test("diary page renders today's context questions", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route(new RegExp(`http://${apiHostPattern}:3001/me$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(user) })
  );

  await page.route(new RegExp(`http://${apiHostPattern}:3001/groups$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([group]) })
  );

  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/context\\?date=.*`),
    (route) =>
      route.fulfill({
        status: 200,
        headers: apiHeaders,
        body: JSON.stringify({
          questions: [
            {
              id: "q1",
              groupId: "g1",
              question: "오늘 가장 좋았던 순간은?",
              displayOrder: 1,
              isActive: true,
              createdByUserId: "u1",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          entry: {
            id: "e1",
            diaryDate: "2026-08-25",
            answers: [
              {
                id: "a1",
                diaryEntryId: "e1",
                questionType: "CUSTOM",
                groupQuestionId: "q1",
                body: "가족이랑 저녁",
                createdAt: "2026-08-25T00:00:00.000Z",
                updatedAt: "2026-08-25T00:00:00.000Z",
              },
            ],
            createdAt: "2026-08-25T00:00:00.000Z",
            updatedAt: "2026-08-25T00:00:00.000Z",
          },
        }),
      })
  );

  await page.goto("/diary");

  await expect(page.getByRole("heading", { name: "오늘의 다이어리" })).toBeVisible();
  await expect(page.getByText("오늘 가장 좋았던 순간은?")).toBeVisible();
  await expect(page.getByText("작성 완료")).toBeVisible();
  await expect(page.getByText("멤버 2명과 함께 오늘의 질문에 답해보세요.")).toBeVisible();
});
