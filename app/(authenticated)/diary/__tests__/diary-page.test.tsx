import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiaryPage from "../page";
import type { Group } from "@/lib/api/groups";
import type { DiaryContextResponse } from "@/lib/api/diary";

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
    answers: [
      {
        id: "a1",
        diaryEntryId: "e1",
        questionType: "CUSTOM",
        groupQuestionId: "q1",
        body: "가족과 저녁 산책",
        createdAt: "2026-08-25T00:00:00.000Z",
        updatedAt: "2026-08-25T00:00:00.000Z",
      },
    ],
  },
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
  });

  it("renders group header, questions, and member sidebar", () => {
    render(<DiaryPage />);

    expect(screen.getByRole("heading", { name: "오늘의 다이어리" })).toBeInTheDocument();
    expect(screen.getByText("우리 가족")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "오늘의 질문 목록" })).toBeInTheDocument();
    expect(screen.getByText("오늘 가장 기뻤던 일은?")).toBeInTheDocument();
    expect(screen.getByText("작성 완료")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "멤버 사이드바" })).toBeInTheDocument();
    expect(screen.getByText("리더 (나)")).toBeInTheDocument();
    expect(screen.getByText("멤버")).toBeInTheDocument();
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
});
