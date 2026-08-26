import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAnswer, updateAnswer } from "@/lib/api/diary";
import { useCreateAnswerMutation, useUpdateAnswerMutation } from "@/hooks/use-diary-answers";
import { diaryContextQueryKey } from "@/hooks/use-diary-context";
import type { DiaryAnswer, DiaryContextResponse } from "@/lib/api/diary";

jest.mock("@/lib/api/diary", () => ({
  ...jest.requireActual("@/lib/api/diary"),
  createAnswer: jest.fn(),
  updateAnswer: jest.fn(),
}));

const mockCreateAnswer = createAnswer as jest.MockedFunction<typeof createAnswer>;
const mockUpdateAnswer = updateAnswer as jest.MockedFunction<typeof updateAnswer>;

const GROUP_ID = "g1";
const DATE = "2026-08-26";

const makeAnswer = (overrides: Partial<DiaryAnswer> = {}): DiaryAnswer => ({
  id: "a1",
  diaryEntryId: "e1",
  questionType: "CUSTOM",
  groupQuestionId: "q1",
  body: "가족과 저녁 산책",
  questionSnapshot: "오늘 가장 기뻤던 일은?",
  createdAt: "2026-08-26T00:00:00.000Z",
  updatedAt: "2026-08-26T00:00:00.000Z",
  ...overrides,
});

const makeContextWithEntry = (answers: DiaryAnswer[]): DiaryContextResponse => ({
  questions: [],
  entry: {
    id: "e1",
    diaryDate: DATE,
    answers,
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  },
});

const makeContextWithoutEntry = (): DiaryContextResponse => ({
  questions: [],
  entry: null,
});

const createWrapper = (queryClient: QueryClient) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

// ── useCreateAnswerMutation ──────────────────────────────────────────────────

describe("useCreateAnswerMutation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("adds the new answer to an existing entry in the cache on success", async () => {
    const qc = makeQueryClient();
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    qc.setQueryData(queryKey, makeContextWithEntry([]));

    const newAnswer = makeAnswer({ id: "a2", body: "새 답변" });
    mockCreateAnswer.mockResolvedValueOnce(newAnswer);

    const { result } = renderHook(() => useCreateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({
        date: DATE,
        questionType: "CUSTOM",
        groupQuestionId: "q1",
        body: "새 답변",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(updated?.entry?.answers).toHaveLength(1);
    expect(updated?.entry?.answers[0]).toMatchObject({ id: "a2", body: "새 답변" });
  });

  it("creates a stub entry when the cache has no entry yet", async () => {
    const qc = makeQueryClient();
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    qc.setQueryData(queryKey, makeContextWithoutEntry());

    const newAnswer = makeAnswer({ id: "a1", body: "첫 답변", diaryEntryId: "new-entry" });
    mockCreateAnswer.mockResolvedValueOnce(newAnswer);

    const { result } = renderHook(() => useCreateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({
        date: DATE,
        questionType: "CUSTOM",
        groupQuestionId: "q1",
        body: "첫 답변",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(updated?.entry?.id).toBe("new-entry");
    expect(updated?.entry?.answers).toHaveLength(1);
  });

  it("exposes API errors", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithoutEntry());

    const error = new Error("그룹 멤버가 아니에요.");
    mockCreateAnswer.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useCreateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ date: DATE, questionType: "CUSTOM", body: "test" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBe(error);
  });

  it("calls createAnswer with the correct arguments", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithEntry([]));
    mockCreateAnswer.mockResolvedValueOnce(makeAnswer());

    const { result } = renderHook(() => useCreateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({
        date: DATE,
        questionType: "CUSTOM",
        groupQuestionId: "q1",
        body: "테스트 답변",
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateAnswer).toHaveBeenCalledWith(GROUP_ID, {
      date: DATE,
      questionType: "CUSTOM",
      groupQuestionId: "q1",
      body: "테스트 답변",
    });
  });
});

// ── useUpdateAnswerMutation ──────────────────────────────────────────────────

describe("useUpdateAnswerMutation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("optimistically updates the answer body in the cache", async () => {
    const qc = makeQueryClient();
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    qc.setQueryData(queryKey, makeContextWithEntry([makeAnswer({ body: "원래 답변" })]));

    // Delay resolution so we can inspect optimistic state
    mockUpdateAnswer.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(makeAnswer({ body: "수정된 답변" })), 100))
    );

    const { result } = renderHook(() => useUpdateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ answerId: "a1", body: "수정된 답변" });
    });

    // Optimistic: cache already has the updated body before the request resolves
    await waitFor(() => {
      const data = qc.getQueryData<DiaryContextResponse>(queryKey);
      expect(data?.entry?.answers[0].body).toBe("수정된 답변");
    });
  });

  it("replaces the answer with the server response on success", async () => {
    const qc = makeQueryClient();
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    qc.setQueryData(queryKey, makeContextWithEntry([makeAnswer({ body: "원래 답변" })]));

    const serverAnswer = makeAnswer({ body: "서버 응답 답변", updatedAt: "2026-08-26T12:00:00.000Z" });
    mockUpdateAnswer.mockResolvedValueOnce(serverAnswer);

    const { result } = renderHook(() => useUpdateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ answerId: "a1", body: "서버 응답 답변" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const updated = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(updated?.entry?.answers[0]).toMatchObject(serverAnswer);
  });

  it("rolls back to the previous cache state on error", async () => {
    const qc = makeQueryClient();
    const queryKey = diaryContextQueryKey(GROUP_ID, DATE);
    const original = makeContextWithEntry([makeAnswer({ body: "원래 답변" })]);
    qc.setQueryData(queryKey, original);

    mockUpdateAnswer.mockRejectedValueOnce(new Error("수정 실패"));

    const { result } = renderHook(() => useUpdateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ answerId: "a1", body: "수정된 답변" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const rolledBack = qc.getQueryData<DiaryContextResponse>(queryKey);
    expect(rolledBack?.entry?.answers[0].body).toBe("원래 답변");
  });

  it("calls updateAnswer with the correct arguments", async () => {
    const qc = makeQueryClient();
    qc.setQueryData(diaryContextQueryKey(GROUP_ID, DATE), makeContextWithEntry([makeAnswer()]));
    mockUpdateAnswer.mockResolvedValueOnce(makeAnswer({ body: "수정됨" }));

    const { result } = renderHook(() => useUpdateAnswerMutation(GROUP_ID, DATE), {
      wrapper: createWrapper(qc),
    });

    act(() => {
      result.current.mutate({ answerId: "a1", body: "수정됨" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateAnswer).toHaveBeenCalledWith(GROUP_ID, "a1", { body: "수정됨" });
  });
});
