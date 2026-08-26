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

const feedResponse = {
  date: "2026-08-26",
  members: [
    {
      userId: "u1",
      user: { id: "u1", name: "리더", profileImageKey: null },
      entry: {
        id: "e1",
        diaryDate: "2026-08-26",
        createdAt: "2026-08-26T00:00:00.000Z",
        updatedAt: "2026-08-26T00:00:00.000Z",
        answers: [
          {
            id: "a1",
            diaryEntryId: "e1",
            questionType: "CUSTOM",
            groupQuestionId: "q1",
            body: "가족이랑 저녁",
            questionSnapshot: "오늘 가장 좋았던 순간은?",
            createdAt: "2026-08-26T00:00:00.000Z",
            updatedAt: "2026-08-26T00:00:00.000Z",
          },
        ],
      },
    },
    {
      userId: "u2",
      user: { id: "u2", name: "멤버", profileImageKey: null },
      entry: null,
    },
  ],
};

async function setupCommonRoutes(page: import("@playwright/test").Page) {
  await page.route(new RegExp(`http://${apiHostPattern}:3001/me$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(user) })
  );
  await page.route(new RegExp(`http://${apiHostPattern}:3001/groups$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([group]) })
  );
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/feed\\?date=.*`),
    (route) =>
      route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(feedResponse) })
  );
}

test("diary page renders today's context questions", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await setupCommonRoutes(page);
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
                questionSnapshot: "오늘 가장 좋았던 순간은?",
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
  // completed question shows checkmark icon
  await expect(page.getByLabel("작성 완료")).toBeVisible();
  await expect(page.getByText("멤버 2명과 함께 오늘의 질문에 답해보세요.")).toBeVisible();
});

test("diary question expand/collapse interaction", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await setupCommonRoutes(page);
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
              question: "오늘 가장 기뻤던 일은?",
              displayOrder: 1,
              isActive: true,
              createdByUserId: "u1",
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            },
          ],
          entry: null,
        }),
      })
  );

  await page.goto("/diary");

  // question is collapsed by default — no textarea visible
  await expect(page.getByRole("textbox")).not.toBeAttached();
  const toggleButton = page.getByRole("button", { name: /질문 1/ });
  await expect(toggleButton).toBeVisible();

  // expand
  await toggleButton.click();
  const textarea = page.getByRole("textbox", { name: "질문 1 답변 입력" });
  await expect(textarea).toBeVisible();
  const submitButton = page.getByRole("button", { name: "답변하기" });
  await expect(submitButton).toBeDisabled();

  // type an answer
  await textarea.fill("오늘 정말 행복했어요");
  await expect(submitButton).toBeEnabled();

  // collapse by clicking the toggle again
  await toggleButton.click();
  await expect(textarea).not.toBeVisible();
});

test("group daily feed renders member entries", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await setupCommonRoutes(page);
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
          entry: null,
        }),
      })
  );

  await page.goto("/diary");

  // Feed section heading
  await expect(page.getByRole("heading", { name: "오늘의 기록" })).toBeVisible();

  // 리더 has an answer
  await expect(page.getByText("리더")).toBeVisible();
  await expect(page.getByText("가족이랑 저녁")).toBeVisible();
  await expect(page.getByRole("img", { name: "모두 작성 완료" })).toBeVisible();

  // 멤버 has no entry
  await expect(page.getByText("멤버")).toBeVisible();
  await expect(page.getByText("아직 오늘의 기록을 남기지 않았어요.")).toBeVisible();
});
