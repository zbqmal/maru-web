import { createAnswer, getDiaryContext, updateAnswer } from "@/lib/api/diary";

describe("diary api", () => {
  const originalFetch = global.fetch;

  const createMockResponse = ({ ok, status, jsonData }: { ok: boolean; status: number; jsonData?: unknown }) =>
    ({
      ok,
      status,
      headers: {
        get: (header: string) => (header === "content-type" ? "application/json" : null),
      },
      json: async () => jsonData,
      text: async () => "",
    }) as unknown as Response;

  const answerFixture = {
    id: "a1",
    diaryEntryId: "e1",
    questionType: "CUSTOM",
    groupQuestionId: "q1",
    body: "오늘 행복했어요",
    questionSnapshot: "오늘 기분은?",
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls GET /groups/:id/diary/context with date", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { questions: [], entry: null } })
    );

    await getDiaryContext("g1", "2026-08-25");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1/diary/context?date=2026-08-25",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("calls POST /groups/:id/diary/answers to create an answer", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 201, jsonData: answerFixture })
    );

    const result = await createAnswer("g1", {
      date: "2026-08-26",
      questionType: "CUSTOM",
      groupQuestionId: "q1",
      body: "오늘 행복했어요",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1/diary/answers",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
    expect(result).toMatchObject({ id: "a1", body: "오늘 행복했어요" });
  });

  it("calls PATCH /groups/:id/diary/answers/:answerId to update an answer", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { ...answerFixture, body: "수정됨" } })
    );

    const result = await updateAnswer("g1", "a1", { body: "수정됨" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1/diary/answers/a1",
      expect.objectContaining({ method: "PATCH", credentials: "include" })
    );
    expect(result).toMatchObject({ id: "a1", body: "수정됨" });
  });
});
