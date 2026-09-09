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
          dailyQuestion: {
            id: "dq1",
            question: "오늘 스스로를 칭찬하고 싶은 순간은?",
            questionDate: "2026-08-25",
            createdAt: "2026-08-25T00:00:00.000Z",
          },
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
  await expect(
    page.getByRole("button", { name: "질문 1 오늘 가장 좋았던 순간은? 작성 완료" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "오늘의 질문 오늘 스스로를 칭찬하고 싶은 순간은?",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "오늘의 질문 오늘 스스로를 칭찬하고 싶은 순간은? 작성 완료",
    })
  ).not.toBeVisible();
  await expect(page.getByText("AI question")).not.toBeVisible();
  // completed question remains visibly marked
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
          dailyQuestion: {
            id: "dq1",
            question: "오늘 스스로를 칭찬하고 싶은 순간은?",
            questionDate: "2026-08-25",
            createdAt: "2026-08-25T00:00:00.000Z",
          },
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

  // daily question shares the same answer interaction
  const dailyToggle = page.getByRole("button", { name: /오늘의 질문/ });
  await dailyToggle.click();
  const dailyTextarea = page.getByRole("textbox", { name: "오늘의 질문 답변 입력" });
  await expect(dailyTextarea).toBeVisible();
  await dailyTextarea.fill("스스로를 믿고 해낸 점");
  await expect(page.getByRole("button", { name: "답변하기" })).toBeEnabled();
});

test("diary question photo picker allows selecting and removing a local preview", async ({
  context,
  page,
}) => {
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

  await page.getByRole("button", { name: /질문 1/ }).click();

  const fileInput = page.getByLabel("사진 첨부하기");
  await fileInput.setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71]),
  });

  await expect(page.getByAltText("첨부한 사진 미리보기 1")).toBeVisible();

  await page.getByRole("button", { name: "사진 1 삭제" }).click();
  await expect(page.getByAltText("첨부한 사진 미리보기 1")).not.toBeAttached();

  // Selecting an unsupported file type shows a validation error instead of a preview.
  await fileInput.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });
  await expect(page.getByText("JPG, PNG, WEBP 형식의 사진만 첨부할 수 있어요.")).toBeVisible();
  await expect(page.getByAltText(/첨부한 사진 미리보기/)).not.toBeAttached();
});

test("diary answer uploads a selected photo through a presigned S3 URL", async ({
  context,
  page,
}) => {
  await context.addCookies([sessionCookie]);

  // Minimal valid 1x1 transparent-free RGBA PNG so the browser can decode
  // its natural dimensions when the app registers photo metadata.
  const pngBuffer = Buffer.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0,
    0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 240, 31, 0,
    5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
  ]);

  let presignedRequestCount = 0;
  let s3UploadCount = 0;
  let registerRequestCount = 0;
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
  await page.route(new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/answers$`), (route) =>
    route.fulfill({
      status: 201,
      headers: apiHeaders,
      body: JSON.stringify({
        id: "a2",
        diaryEntryId: "e2",
        questionType: "CUSTOM",
        groupQuestionId: "q1",
        body: "사진 업로드와 함께 저장",
        questionSnapshot: "오늘 가장 기뻤던 일은?",
        createdAt: "2026-08-26T00:00:00.000Z",
        updatedAt: "2026-08-26T00:00:00.000Z",
      }),
    })
  );
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/entries/e2/photos/upload-url$`),
    async (route) => {
      presignedRequestCount += 1;
      expect(route.request().postDataJSON()).toEqual({
        mimeType: "image/png",
        sizeBytes: pngBuffer.length,
      });
      await route.fulfill({
        status: 201,
        headers: apiHeaders,
        body: JSON.stringify({
          uploadUrl: "https://s3.example.test/diary/e2/photo.png",
          storageKey: "diary/e2/photo.png",
        }),
      });
    }
  );
  await page.route("https://s3.example.test/diary/e2/photo.png", async (route) => {
    if (route.request().method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "http://127.0.0.1:3000",
          "access-control-allow-methods": "PUT, OPTIONS",
          "access-control-allow-headers": "content-type",
        },
      });
      return;
    }

    s3UploadCount += 1;
    expect(route.request().method()).toBe("PUT");
    expect(route.request().headers()["content-type"]).toBe("image/png");
    await route.fulfill({
      status: 200,
      headers: {
        "access-control-allow-origin": "http://127.0.0.1:3000",
      },
    });
  });
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/entries/e2/photos$`),
    async (route) => {
      registerRequestCount += 1;
      expect(route.request().postDataJSON()).toEqual({
        storageKey: "diary/e2/photo.png",
        mimeType: "image/png",
        width: 1,
        height: 1,
        sizeBytes: pngBuffer.length,
      });
      await route.fulfill({
        status: 201,
        headers: apiHeaders,
        body: JSON.stringify({
          id: "p1",
          diaryEntryId: "e2",
          uploadedByUserId: "u1",
          storageKey: "diary/e2/photo.png",
          mimeType: "image/png",
          width: 1,
          height: 1,
          sizeBytes: pngBuffer.length,
          displayOrder: 0,
          createdAt: "2026-08-26T00:00:00.000Z",
        }),
      });
    }
  );

  await page.goto("/diary");
  await page.getByRole("button", { name: /질문 1/ }).click();
  await page.getByRole("textbox", { name: "질문 1 답변 입력" }).fill("사진 업로드와 함께 저장");
  await page.getByLabel("사진 첨부하기").setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: pngBuffer,
  });
  await page.getByRole("button", { name: "답변하기" }).click();

  await expect(page.getByRole("textbox", { name: "질문 1 답변 입력" })).not.toBeAttached();
  expect(presignedRequestCount).toBe(1);
  expect(s3UploadCount).toBe(1);
  expect(registerRequestCount).toBe(1);
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

  // 리더 has an answer list
  const leaderCard = page.getByLabel("리더의 오늘 기록");
  await expect(leaderCard.getByText("리더")).toBeVisible();
  await expect(leaderCard.getByRole("list", { name: "리더의 답변 목록" })).toBeVisible();
  await expect(leaderCard.getByText("가족이랑 저녁")).toBeVisible();
  await expect(page.getByRole("img", { name: "모두 작성 완료" })).not.toBeAttached();

  // 멤버 has no entry
  const memberCard = page.getByLabel("멤버의 오늘 기록");
  await expect(memberCard.getByText("멤버")).toBeVisible();
  await expect(memberCard.getByText("아직 오늘의 기록을 남기지 않았어요.")).toBeVisible();
  await expect(page.getByRole("img", { name: "아직 미작성" })).not.toBeAttached();
});

test("group daily feed renders a photo gallery and allows the owner to remove a photo", async ({
  context,
  page,
}) => {
  await context.addCookies([sessionCookie]);

  const photo = {
    id: "p1",
    diaryEntryId: "e1",
    uploadedByUserId: "u1",
    storageKey: "diary/e1/photo-1.png",
    mimeType: "image/png",
    width: 800,
    height: 600,
    sizeBytes: 1024,
    displayOrder: 0,
    createdAt: "2026-08-26T00:00:00.000Z",
  };
  const feedWithPhotos = {
    ...feedResponse,
    members: [
      { ...feedResponse.members[0], entry: { ...feedResponse.members[0].entry, photos: [photo] } },
      feedResponse.members[1],
    ],
  };

  await page.route(new RegExp(`http://${apiHostPattern}:3001/me$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(user) })
  );
  await page.route(new RegExp(`http://${apiHostPattern}:3001/groups$`), (route) =>
    route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify([group]) })
  );
  let feedRequestCount = 0;
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/feed\\?date=.*`),
    (route) => {
      feedRequestCount += 1;
      const body = feedRequestCount === 1 ? feedWithPhotos : { ...feedWithPhotos, members: [feedWithPhotos.members[1]].concat({ ...feedWithPhotos.members[0], entry: { ...feedWithPhotos.members[0].entry, photos: [] } }) };
      route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(body) });
    }
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
          entry: null,
        }),
      })
  );
  await page.route(`https://media.example.test/diary/e1/photo-1.png`, (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from([
        137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6,
        0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 248, 207, 192, 240,
        31, 0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
      ]),
    })
  );
  let deleteRequestCount = 0;
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/entries/e1/photos/p1$`),
    async (route) => {
      deleteRequestCount += 1;
      expect(route.request().method()).toBe("DELETE");
      await route.fulfill({ status: 204 });
    }
  );

  await page.goto("/diary");

  const leaderCard = page.getByLabel("리더의 오늘 기록");
  await expect(leaderCard.getByAltText("다이어리 사진 1")).toBeVisible();

  const removeButton = leaderCard.getByRole("button", { name: "사진 1 삭제" });
  await expect(removeButton).toBeVisible();
  await removeButton.click();

  await expect.poll(() => deleteRequestCount).toBe(1);
  await expect(leaderCard.getByAltText("다이어리 사진 1")).not.toBeAttached();
});

test("saving an answer refreshes the group daily feed", async ({ context, page }) => {
  await context.addCookies([sessionCookie]);

  let feedRequestCount = 0;
  await setupCommonRoutes(page);
  await page.route(
    new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/feed\\?date=.*`),
    (route) => {
      feedRequestCount += 1;
      const response =
        feedRequestCount === 1
          ? feedResponse
          : {
              ...feedResponse,
              members: feedResponse.members.map((member) =>
                member.userId === "u1"
                  ? {
                      ...member,
                      entry: {
                        ...member.entry!,
                        answers: [
                          ...member.entry!.answers,
                          {
                            ...member.entry!.answers[0],
                            id: "a2",
                            body: "저장 후 피드에 표시",
                          },
                        ],
                      },
                    }
                  : member
              ),
            };
      return route.fulfill({ status: 200, headers: apiHeaders, body: JSON.stringify(response) });
    }
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
          entry: null,
        }),
      })
  );
  await page.route(new RegExp(`http://${apiHostPattern}:3001/groups/g1/diary/answers$`), (route) =>
    route.fulfill({
      status: 201,
      headers: apiHeaders,
      body: JSON.stringify({
        ...feedResponse.members[0].entry!.answers[0],
        id: "a2",
        body: "저장 후 피드에 표시",
      }),
    })
  );

  await page.goto("/diary");
  await page.getByRole("button", { name: /질문 1/ }).click();
  await page.getByRole("textbox", { name: "질문 1 답변 입력" }).fill("저장 후 피드에 표시");
  await page.getByRole("button", { name: "답변하기" }).click();

  const leaderCard = page.getByLabel("리더의 오늘 기록");
  await expect(leaderCard.getByText("저장 후 피드에 표시")).toBeVisible();
  expect(feedRequestCount).toBe(2);
});
