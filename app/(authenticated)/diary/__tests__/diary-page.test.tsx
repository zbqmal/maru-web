import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiaryPage from "../page";
import type { Group } from "@/lib/api/groups";
import type { DiaryContextResponse, DiaryAnswer } from "@/lib/api/diary";
import { requestDiaryPhotoUpload } from "@/lib/api/diary";
import { uploadFileToPresignedUrl } from "@/lib/api/uploads";

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
  dailyQuestion: {
    id: "dq1",
    question: "오늘 스스로를 칭찬하고 싶은 순간은?",
    questionDate: "2026-08-25",
    createdAt: "2026-08-25T00:00:00.000Z",
  },
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
const mockRegisterPhotoMutateAsync = jest.fn();
const mockGroupDailyFeedQuery = jest.fn();

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

jest.mock("@/hooks/use-group-daily-feed", () => ({
  useGroupDailyFeedQuery: (...args: unknown[]) => {
    mockGroupDailyFeedQuery(...args);
    return { data: undefined, isLoading: false, isError: false, refetch: jest.fn() };
  },
}));

jest.mock("@/hooks/use-diary-answers", () => ({
  useCreateAnswerMutation: () => ({ mutateAsync: mockCreateAnswerMutateAsync }),
  useUpdateAnswerMutation: () => ({ mutateAsync: mockUpdateAnswerMutateAsync }),
}));

jest.mock("@/hooks/use-diary-photos", () => ({
  useRegisterDiaryPhotoMutation: () => ({ mutateAsync: mockRegisterPhotoMutateAsync }),
  useDeleteDiaryPhotoMutation: () => ({ mutate: jest.fn(), isPending: false, variables: undefined }),
}));

jest.mock("@/lib/api/diary", () => ({
  ...jest.requireActual("@/lib/api/diary"),
  requestDiaryPhotoUpload: jest.fn(),
}));

jest.mock("@/lib/api/uploads", () => ({
  uploadFileToPresignedUrl: jest.fn(),
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
    mockRegisterPhotoMutateAsync.mockResolvedValue({
      id: "p1",
      diaryEntryId: "e1",
      uploadedByUserId: "u1",
      storageKey: "diary/e1/photo.png",
      mimeType: "image/png",
      width: 800,
      height: 600,
      sizeBytes: 1024,
      displayOrder: 0,
      createdAt: "2026-08-25T00:00:00.000Z",
    });
    (requestDiaryPhotoUpload as jest.Mock).mockResolvedValue({
      uploadUrl: "https://s3.example.test/upload",
      storageKey: "diary/e1/photo.png",
    });
    (uploadFileToPresignedUrl as jest.Mock).mockResolvedValue(undefined);
    window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = jest.fn();

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 800;
      naturalHeight = 600;
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    // @ts-expect-error -- simplified stand-in for the browser Image constructor
    global.Image = MockImage;
  });

  it("passes the active group and diary date to the daily feed", () => {
    render(<DiaryPage />);

    expect(mockGroupDailyFeedQuery).toHaveBeenCalledWith(
      "g1",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    );
  });

  it("renders group header and today questions with answered status", () => {
    render(<DiaryPage />);

    expect(screen.getByRole("heading", { name: "오늘의 다이어리" })).toBeInTheDocument();
    expect(screen.getByText("우리 가족")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "오늘의 질문 목록" })).toBeInTheDocument();
    expect(screen.getByText("오늘 가장 기뻤던 일은?")).toBeInTheDocument();
    expect(screen.getByText("오늘 스스로를 칭찬하고 싶은 순간은?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /오늘의 질문 오늘 스스로를 칭찬하고 싶은 순간은\?/ })
    ).toBeInTheDocument();
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
    expect(
      screen.getByRole("status", { name: "오늘의 다이어리를 불러오는 중..." })
    ).toBeInTheDocument();
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

  it("creates a DAILY answer for today's global question", async () => {
    mockDiaryResult = {
      data: mockContextNoEntry,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };

    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /오늘의 질문/i }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "오늘의 질문 답변 입력" }),
      "오늘은 포기하지 않았다"
    );
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() =>
      expect(mockCreateAnswerMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: "DAILY",
          body: "오늘은 포기하지 않았다",
        })
      )
    );
    expect(mockCreateAnswerMutateAsync).toHaveBeenCalledWith(
      expect.not.objectContaining({ groupQuestionId: "dq1" })
    );
  });

  it("updates an existing DAILY answer", async () => {
    const dailyAnswer: DiaryAnswer = {
      id: "a2",
      diaryEntryId: "e1",
      questionType: "DAILY",
      groupQuestionId: null,
      body: "기존 답변",
      questionSnapshot: "오늘 스스로를 칭찬하고 싶은 순간은?",
      createdAt: "2026-08-25T00:00:00.000Z",
      updatedAt: "2026-08-25T00:00:00.000Z",
    };

    mockDiaryResult = {
      data: {
        ...mockContext,
        entry: {
          ...mockContext.entry!,
          answers: [mockAnswer, dailyAnswer],
        },
      },
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };

    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /오늘의 질문/i }));
    const textarea = screen.getByRole("textbox", { name: "오늘의 질문 답변 입력" });
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "수정된 오늘의 질문 답변");
    await userEvent.click(screen.getByRole("button", { name: "수정하기" }));

    await waitFor(() =>
      expect(mockUpdateAnswerMutateAsync).toHaveBeenCalledWith({
        answerId: "a2",
        body: "수정된 오늘의 질문 답변",
      })
    );
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

  it("requests a presigned URL and uploads selected photos after saving an answer", async () => {
    mockDiaryResult = {
      data: mockContextNoEntry,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    (uploadFileToPresignedUrl as jest.Mock).mockImplementation(async (_url, _file, onProgress) => {
      onProgress({ percent: 75, loaded: 768, total: 1024 });
    });

    render(<DiaryPage />);

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "사진과 함께 저장");
    const photo = new File([new Uint8Array(1024)], "photo.png", { type: "image/png" });
    await userEvent.upload(screen.getByLabelText("사진 첨부하기"), photo);
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() =>
      expect(requestDiaryPhotoUpload).toHaveBeenCalledWith("g1", "e1", {
        mimeType: "image/png",
        sizeBytes: 1024,
      })
    );
    expect(uploadFileToPresignedUrl).toHaveBeenCalledWith(
      "https://s3.example.test/upload",
      photo,
      expect.any(Function)
    );
    await waitFor(() =>
      expect(mockRegisterPhotoMutateAsync).toHaveBeenCalledWith({
        diaryEntryId: "e1",
        input: {
          storageKey: "diary/e1/photo.png",
          mimeType: "image/png",
          width: 800,
          height: 600,
          sizeBytes: 1024,
        },
      })
    );
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
