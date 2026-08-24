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

const leaderUser = {
  id: "u1",
  email: "leader@example.com",
  name: "리더",
  birthday: null,
  profileImageKey: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const memberUser = {
  id: "u2",
  email: "member@example.com",
  name: "멤버",
  birthday: null,
  profileImageKey: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const makeGroup = (leaderUserId = "u1") => ({
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
});

const makeQuestion = (id: string, question: string, displayOrder: number) => ({
  id,
  groupId: "g1",
  question,
  displayOrder,
  isActive: true,
  createdByUserId: "u1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

const setupLeaderRoutes = async (
  page: Parameters<Parameters<typeof test>[1]>[0]["page"],
  questions: ReturnType<typeof makeQuestion>[]
) => {
  await page.route("http://127.0.0.1:3001/me", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(leaderUser) })
  );
  await page.route("http://127.0.0.1:3001/groups", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([makeGroup()]) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(questions) });
    } else {
      await route.continue();
    }
  });
};

test("leader can see the question settings page with questions", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  const questions = [
    makeQuestion("q1", "오늘 기분은?", 1),
    makeQuestion("q2", "오늘 가장 즐거웠던 일은?", 2),
  ];

  await setupLeaderRoutes(page, questions);
  await page.goto("/questions");

  await expect(page.getByRole("heading", { name: "질문 설정하기" })).toBeVisible();
  await expect(page.getByText("오늘 기분은?")).toBeVisible();
  await expect(page.getByText("오늘 가장 즐거웠던 일은?")).toBeVisible();
  await expect(page.getByText("2 / 4")).toBeVisible();
});

test("leader can add a question", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  const questions: ReturnType<typeof makeQuestion>[] = [];
  const newQuestion = makeQuestion("q1", "오늘 가장 감사한 일은?", 1);

  await page.route("http://127.0.0.1:3001/me", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(leaderUser) })
  );
  await page.route("http://127.0.0.1:3001/groups", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([makeGroup()]) })
  );

  let questionsData = [...questions];
  await page.route("http://127.0.0.1:3001/groups/g1/questions", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(questionsData) });
    } else if (route.request().method() === "POST") {
      questionsData = [...questionsData, newQuestion];
      await route.fulfill({ status: 201, headers: apiHeaders, body: JSON.stringify(newQuestion) });
    } else {
      await route.continue();
    }
  });

  await page.goto("/questions");
  await page.getByRole("button", { name: /질문 추가하기/ }).click();
  await expect(page.getByRole("heading", { name: "질문 추가하기" })).toBeVisible();

  await page.getByLabel("질문 내용").fill("오늘 가장 감사한 일은?");
  await page.getByRole("button", { name: "추가" }).click();

  await expect(page.getByRole("heading", { name: "질문 추가하기" })).not.toBeVisible();
});

test("leader can edit a question", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  const questions = [makeQuestion("q1", "오늘 기분은?", 1)];
  const updated = makeQuestion("q1", "오늘 배운 것은?", 1);

  await page.route("http://127.0.0.1:3001/me", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(leaderUser) })
  );
  await page.route("http://127.0.0.1:3001/groups", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([makeGroup()]) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(questions) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions/q1", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(updated) });
    } else {
      await route.continue();
    }
  });

  await page.goto("/questions");
  await page.getByRole("button", { name: "질문 수정" }).click();
  await expect(page.getByRole("heading", { name: "질문 수정하기" })).toBeVisible();
  await expect(page.getByLabel("질문 내용")).toHaveValue("오늘 기분은?");

  await page.getByLabel("질문 내용").fill("오늘 배운 것은?");
  await page.getByRole("button", { name: "저장" }).click();

  await expect(page.getByRole("heading", { name: "질문 수정하기" })).not.toBeVisible();
});

test("leader can delete a question", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  let questionsData = [makeQuestion("q1", "오늘 기분은?", 1)];

  await page.route("http://127.0.0.1:3001/me", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(leaderUser) })
  );
  await page.route("http://127.0.0.1:3001/groups", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([makeGroup()]) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(questionsData) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions/q1", async (route) => {
    if (route.request().method() === "DELETE") {
      questionsData = [];
      await route.fulfill({ status: 204, headers: apiHeaders });
    } else {
      await route.continue();
    }
  });

  await page.goto("/questions");
  await page.getByRole("button", { name: "질문 삭제" }).click();
  await expect(page.getByRole("heading", { name: "질문 삭제" })).toBeVisible();

  await page.getByRole("button", { name: "삭제" }).click();
  await expect(page.getByRole("heading", { name: "질문 삭제" })).not.toBeVisible();
});

test("add button is disabled when 4 questions exist", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  const questions = [1, 2, 3, 4].map((n) =>
    makeQuestion(`q${n}`, `질문 ${n}`, n)
  );

  await setupLeaderRoutes(page, questions);
  await page.goto("/questions");

  await expect(page.getByRole("button", { name: /질문 추가하기/ })).toBeDisabled();
});

test("member sees read-only view without add/edit/delete controls", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  await page.route("http://127.0.0.1:3001/me", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(memberUser) })
  );
  await page.route("http://127.0.0.1:3001/groups", (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([makeGroup()]) })
  );
  await page.route("http://127.0.0.1:3001/groups/g1/questions", (route) =>
    route.fulfill({
      status: 200,
      headers: apiHeaders,
      body: JSON.stringify([makeQuestion("q1", "오늘 기분은?", 1)]),
    })
  );

  await page.goto("/questions");

  await expect(page.getByText("오늘 기분은?")).toBeVisible();
  await expect(page.getByRole("button", { name: /질문 추가하기/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "질문 수정" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "질문 삭제" })).toHaveCount(0);
  await expect(page.getByText("읽기 전용")).toBeVisible();
});
