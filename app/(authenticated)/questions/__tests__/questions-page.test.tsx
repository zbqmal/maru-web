import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QuestionsPage from "../page";
import type { Group } from "@/lib/api/groups";
import type { GroupQuestion } from "@/lib/api/questions";

// ── Mock hooks ──────────────────────────────────────────────────────────────

const mockCurrentUser = { id: "u1", email: "leader@example.com", name: "리더" };

const makeGroup = (leaderUserId = "u1"): Group => ({
  id: "g1",
  name: "우리 가족",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  memberships: [
    {
      id: "m1",
      userId: leaderUserId,
      role: "LEADER",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      user: { id: leaderUserId, name: "리더", profileImageKey: null },
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
});

const makeQuestion = (overrides: Partial<GroupQuestion> = {}): GroupQuestion => ({
  id: "q1",
  groupId: "g1",
  question: "오늘 기분은?",
  displayOrder: 1,
  isActive: true,
  createdByUserId: "u1",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  ...overrides,
});

let mockActiveGroupResult: {
  activeGroup: Group | null;
  activeGroupId: string | null;
  groups: Group[];
  isLoading: boolean;
  isError: boolean;
} = {
  activeGroup: null,
  activeGroupId: null,
  groups: [],
  isLoading: false,
  isError: false,
};

let mockQuestionsResult: {
  data: GroupQuestion[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
} = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockReorder = jest.fn();

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => ({ data: mockCurrentUser }),
}));

jest.mock("@/hooks/use-groups", () => ({
  useActiveGroupQuery: () => mockActiveGroupResult,
}));

jest.mock("@/hooks/use-questions", () => ({
  useQuestionsQuery: () => mockQuestionsResult,
  useCreateQuestionMutation: () => ({
    mutate: mockCreate,
    isPending: false,
    error: null,
  }),
  useUpdateQuestionMutation: () => ({
    mutate: mockUpdate,
    isPending: false,
    error: null,
  }),
  useDeleteQuestionMutation: () => ({
    mutate: mockDelete,
    isPending: false,
    error: null,
  }),
  useReorderQuestionsMutation: () => ({
    mutate: mockReorder,
    isPending: false,
    error: null,
  }),
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

const renderPage = () => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <QuestionsPage />
    </QueryClientProvider>
  );
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("QuestionsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroupResult = {
      activeGroup: makeGroup("u1"),
      activeGroupId: "g1",
      groups: [makeGroup("u1")],
      isLoading: false,
      isError: false,
    };
    mockQuestionsResult = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
  });

  it("renders the page heading", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: "질문 설정하기" })).toBeInTheDocument();
  });

  it("shows no-group empty state when no active group", () => {
    mockActiveGroupResult = {
      activeGroup: null,
      activeGroupId: null,
      groups: [],
      isLoading: false,
      isError: false,
    };
    renderPage();
    expect(screen.getByText("그룹을 먼저 선택해주세요")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockQuestionsResult = { data: undefined, isLoading: true, isError: false, refetch: jest.fn() };
    renderPage();
    expect(screen.getByRole("status", { name: "질문을 불러오는 중..." })).toBeInTheDocument();
  });

  it("shows error state with retry button", async () => {
    const refetch = jest.fn();
    mockQuestionsResult = { data: undefined, isLoading: false, isError: true, refetch };
    renderPage();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("shows empty question state for leader", () => {
    mockQuestionsResult = { data: [], isLoading: false, isError: false, refetch: jest.fn() };
    renderPage();
    expect(screen.getByText("아직 설정된 질문이 없어요")).toBeInTheDocument();
  });

  it("shows question list when questions exist", () => {
    mockQuestionsResult = {
      data: [makeQuestion()],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    renderPage();
    expect(screen.getByRole("list", { name: "질문 목록" })).toBeInTheDocument();
    expect(screen.getByText("오늘 기분은?")).toBeInTheDocument();
  });

  it("shows 질문 추가하기 button for leader", () => {
    renderPage();
    expect(screen.getByRole("button", { name: /질문 추가하기/ })).toBeInTheDocument();
  });

  it("does NOT show 질문 추가하기 button for member", () => {
    // Current user is "u2" (member role)
    (
      jest.requireMock("@/hooks/use-current-user") as {
        useCurrentUserQuery: () => { data: typeof mockCurrentUser };
      }
    ).useCurrentUserQuery = () => ({ data: { id: "u2", email: "m@x.com", name: "멤버" } });

    renderPage();
    expect(screen.queryByRole("button", { name: /질문 추가하기/ })).not.toBeInTheDocument();

    // Restore
    (
      jest.requireMock("@/hooks/use-current-user") as {
        useCurrentUserQuery: () => { data: typeof mockCurrentUser };
      }
    ).useCurrentUserQuery = () => ({ data: mockCurrentUser });
  });

  it("opens add dialog when 질문 추가하기 is clicked", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /질문 추가하기/ }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "질문 추가하기" })).toBeInTheDocument()
    );
  });

  it("calls createMutation.mutate when add dialog is submitted", async () => {
    mockCreate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /질문 추가하기/ }));
    await user.type(screen.getByLabelText("질문 내용"), "오늘 가장 즐거웠던 일은?");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(mockCreate).toHaveBeenCalledWith(
      { question: "오늘 가장 즐거웠던 일은?" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("opens edit dialog with pre-filled value when 질문 수정 is clicked", async () => {
    mockQuestionsResult = {
      data: [makeQuestion({ question: "오늘 기분은?" })],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "질문 수정" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "질문 수정하기" })).toBeInTheDocument()
    );
    expect(screen.getByLabelText("질문 내용")).toHaveValue("오늘 기분은?");
  });

  it("calls updateMutation.mutate when edit dialog is submitted", async () => {
    mockQuestionsResult = {
      data: [makeQuestion({ id: "q1", question: "오늘 기분은?" })],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    mockUpdate.mockImplementation((_input: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "질문 수정" }));
    const input = screen.getByLabelText("질문 내용");
    await user.clear(input);
    await user.type(input, "오늘 배운 것은?");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(mockUpdate).toHaveBeenCalledWith(
      { questionId: "q1", question: "오늘 배운 것은?" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("opens delete dialog when 질문 삭제 is clicked", async () => {
    mockQuestionsResult = {
      data: [makeQuestion({ question: "오늘 기분은?" })],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "질문 삭제" }));
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "질문 삭제" })).toBeInTheDocument()
    );
    expect(screen.getAllByText(/오늘 기분은?/).length).toBeGreaterThanOrEqual(1);
  });

  it("calls deleteMutation.mutate when delete is confirmed", async () => {
    mockQuestionsResult = {
      data: [makeQuestion({ id: "q1" })],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    mockDelete.mockImplementation((_id: unknown, opts: { onSuccess: () => void }) => {
      opts.onSuccess();
    });
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: "질문 삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(mockDelete).toHaveBeenCalledWith(
      "q1",
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it("disables 질문 추가하기 button when at max (4 questions)", () => {
    mockQuestionsResult = {
      data: [1, 2, 3, 4].map((n) =>
        makeQuestion({ id: `q${n}`, displayOrder: n, question: `질문 ${n}` })
      ),
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    renderPage();
    expect(screen.getByRole("button", { name: /질문 추가하기/ })).toBeDisabled();
  });

  it("calls reorderMutation.mutate when move-up is clicked", async () => {
    mockQuestionsResult = {
      data: [
        makeQuestion({ id: "q1", displayOrder: 1, question: "질문 1" }),
        makeQuestion({ id: "q2", displayOrder: 2, question: "질문 2" }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const user = userEvent.setup();
    renderPage();
    const moveUpButtons = screen.getAllByRole("button", { name: "위로 이동" });
    // Second question's move-up button (index 1)
    await user.click(moveUpButtons[1]);
    expect(mockReorder).toHaveBeenCalledWith({ questionIds: ["q2", "q1"] });
  });

  it("calls reorderMutation.mutate when move-down is clicked", async () => {
    mockQuestionsResult = {
      data: [
        makeQuestion({ id: "q1", displayOrder: 1, question: "질문 1" }),
        makeQuestion({ id: "q2", displayOrder: 2, question: "질문 2" }),
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    const user = userEvent.setup();
    renderPage();
    const moveDownButtons = screen.getAllByRole("button", { name: "아래로 이동" });
    // First question's move-down (index 0)
    await user.click(moveDownButtons[0]);
    expect(mockReorder).toHaveBeenCalledWith({ questionIds: ["q2", "q1"] });
  });

  it("shows 리더 전용 sidebar card for leader", () => {
    mockQuestionsResult = { data: [], isLoading: false, isError: false, refetch: jest.fn() };
    renderPage();
    expect(screen.getByText("리더 전용")).toBeInTheDocument();
  });

  it("shows 읽기 전용 sidebar card for member", () => {
    (
      jest.requireMock("@/hooks/use-current-user") as {
        useCurrentUserQuery: () => { data: typeof mockCurrentUser };
      }
    ).useCurrentUserQuery = () => ({ data: { id: "u2", email: "m@x.com", name: "멤버" } });
    mockQuestionsResult = { data: [], isLoading: false, isError: false, refetch: jest.fn() };

    renderPage();
    expect(screen.getByText("읽기 전용")).toBeInTheDocument();

    // Restore
    (
      jest.requireMock("@/hooks/use-current-user") as {
        useCurrentUserQuery: () => { data: typeof mockCurrentUser };
      }
    ).useCurrentUserQuery = () => ({ data: mockCurrentUser });
  });
});
