import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiaryPage from "../page";
import type { Group } from "@/lib/api/groups";
import type { DiaryContextResponse, DiaryAnswer } from "@/lib/api/diary";

const mockGroup: Group = {
  id: "g1",
  name: "우리 가족",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  memberships: [
    {
      id: "m1",
      userId: "u1",
      role: "LEADER",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      user: { id: "u1", name: "리더", profileImageKey: null },
    },
    {
      id: "m2",
      userId: "u2",
      role: "MEMBER",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      user: { id: "u2", name: "멤버", profileImageKey: null },
    },
  ],
};

const mockAnswer: DiaryAnswer = {
  id: "a1",
  diaryEntryId: "e1",
  questionType: "CUSTOM",
  groupQuestionId: "q1",
  body: "가족과 저녁 산책",
  questionSnapshot: "오늘 가장 기뻤던 일은?",
  createdAt: "2026-08-25T00:00:00.000Z",
  updatedAt: "2026-08-25T00:00:00.000Z",
};

const mockContext: DiaryContextResponse = {
  questions: [
    {
      id: "q1",
      groupId: "g1",
      question: "오늘 가장 기뻤던 일은?",
      displayOrder: 1,
      isActive: true,
      createdByUserId: "u1",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
  ],
  entry: {
    id: "e1",
    diaryDate: "2026-08-25",
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    answers: [mockAnswer],
  },
};

const mockContextNoEntry: DiaryContextResponse = {
  ...mockContext,
  entry: null,
};

let mockActiveGroup: Group | null = mockGroup;
let mockDiaryResult: {
  data: DiaryContextResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
} = {
  data: mockContext,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

const mockCreateAnswerMutateAsync = jest.fn();
const mockUpdateAnswerMutateAsync = jest.fn();

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => ({ data: { id: "u1", email: "leader@example.com", name: "리더" } }),
}));

jest.mock("@/hooks/use-groups", () => ({
  useActiveGroupQuery: () => ({
    activeGroup: mockActiveGroup,
  }),
}));

jest.mock("@/hooks/use-diary-context", () => ({
  useDiaryContextQuery: () => mockDiaryResult,
}));

jest.mock("@/hooks/use-diary-answers", () => ({
  useCreateAnswerMutation: () => ({ mutateAsync: mockCreateAnswerMutateAsync }),
  useUpdateAnswerMutation: () => ({ mutateAsync: mockUpdateAnswerMutateAsync }),
}));

describe("DiaryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroup = mockGroup;
    mockDiaryResult = {
      data: mockContext,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    mockCreateAnswerMutateAsync.mockResolvedValue(mockAnswer);
    mockUpdateAnswerMutateAsync.mockResolvedValue({ ...mockAnswer, body: "수정된 답변" });
  });

  it("renders group header and today questions with answered status", () => {
    render(<DiaryPage />);

    expect(screen.getByRole("heading", { name: "오늘의 다이어리" })).toBeInTheDocument();
    expect(screen.getByText("우리 가족")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "오늘의 질문 목록" })).toBeInTheDocument();
    expect(screen.getByText("오늘 가장 기뻤던 일은?")).toBeInTheDocument();
    expect(screen.getByLabelText("작성 완료")).toBeInTheDocument();
    expect(screen.getByText("멤버 2명과 함께 오늘의 질문에 답해보세요.")).toBeInTheDocument();
  });

  it("shows no-group empty state", () => {
    mockActiveGroup = null;
    render(<DiaryPage />);
    expect(screen.getByText("그룹을 먼저 선택해주세요")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockDiaryResult = { data: undefined, isLoading: true, isError: false, refetch: jest.fn() };
    render(<DiaryPage />);
    expect(screen.getByRole("status", { name: "오늘의 다이어리를 불러오는 중..." })).toBeInTheDocument();
  });

  it("shows error state and retries", async () => {
    const refetch = jest.fn();
    mockDiaryResult = { data: undefined, isLoading: false, isError: true, refetch };
    render(<DiaryPage />);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows no-question state when context has no questions", () => {
    mockDiaryResult = {
      data: { questions: [], entry: null },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    render(<DiaryPage />);
    expect(screen.getByText("아직 활성화된 질문이 없어요")).toBeInTheDocument();
  });

  it("calls createAnswer when submitting a new answer (no existing entry)", async () => {
    mockDiaryResult = {
      data: mockContextNoEntry,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "좋은 하루");
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() =>
      expect(mockCreateAnswerMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: "CUSTOM",
          groupQuestionId: "q1",
          body: "좋은 하루",
        })
      )
    );
    expect(mockUpdateAnswerMutateAsync).not.toHaveBeenCalled();
  });

  it("calls updateAnswer when editing an existing answer", async () => {
    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    const textarea = screen.getByRole("textbox");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "수정된 답변");
    await userEvent.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() =>
      expect(mockUpdateAnswerMutateAsync).toHaveBeenCalledWith({
        answerId: "a1",
        body: "수정된 답변",
      })
    );
    expect(mockCreateAnswerMutateAsync).not.toHaveBeenCalled();
  });

  it("collapses the card after a successful submit", async () => {
    mockDiaryResult = {
      data: mockContextNoEntry,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "답변 내용");
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
  });

  it("keeps the card expanded when submit throws an error", async () => {
    mockDiaryResult = {
      data: mockContextNoEntry,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    mockCreateAnswerMutateAsync.mockRejectedValueOnce(new Error("서버 오류"));

    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "답변 내용");
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => expect(mockCreateAnswerMutateAsync).toHaveBeenCalled());
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
