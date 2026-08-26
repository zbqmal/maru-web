import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GroupDailyFeed from "../group-daily-feed";
import type { GroupDailyFeedResponse } from "@/lib/api/diary";

const mockRefetch = jest.fn();
let mockFeedResult: {
  data: GroupDailyFeedResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
} = {
  data: undefined,
  isLoading: false,
  isError: false,
  refetch: mockRefetch,
};

jest.mock("@/hooks/use-group-daily-feed", () => ({
  useGroupDailyFeedQuery: () => mockFeedResult,
}));

const feedData: GroupDailyFeedResponse = {
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
            body: "공원 산책",
            questionSnapshot: "오늘 가장 좋았던 순간은?",
            createdAt: "2026-08-26T00:00:00.000Z",
            updatedAt: "2026-08-26T00:00:00.000Z",
          },
          {
            id: "a2",
            diaryEntryId: "e1",
            questionType: "CUSTOM",
            groupQuestionId: "q2",
            body: "TypeScript 배움",
            questionSnapshot: "오늘 배운 것은?",
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
    {
      userId: "u3",
      user: { id: "u3", name: "민수", profileImageKey: null },
      entry: {
        id: "e3",
        diaryDate: "2026-08-26",
        createdAt: "2026-08-26T00:00:00.000Z",
        updatedAt: "2026-08-26T00:00:00.000Z",
        answers: [
          {
            id: "a3",
            diaryEntryId: "e3",
            questionType: "CUSTOM",
            groupQuestionId: "q1",
            body: "맛있는 점심",
            questionSnapshot: "오늘 가장 좋았던 순간은?",
            createdAt: "2026-08-26T00:00:00.000Z",
            updatedAt: "2026-08-26T00:00:00.000Z",
          },
        ],
      },
    },
  ],
};

describe("GroupDailyFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFeedResult = {
      data: feedData,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };
  });

  it("renders a card for each member", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByText("리더")).toBeInTheDocument();
    expect(screen.getByText("멤버")).toBeInTheDocument();
    expect(screen.getByText("민수")).toBeInTheDocument();
  });

  it("shows loading spinner while loading", () => {
    mockFeedResult = { data: undefined, isLoading: true, isError: false, refetch: mockRefetch };
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByRole("status", { name: "오늘의 기록을 불러오는 중..." })).toBeInTheDocument();
  });

  it("shows error state and calls refetch on retry", async () => {
    mockFeedResult = { data: undefined, isLoading: false, isError: true, refetch: mockRefetch };
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("shows empty state when members list is empty", () => {
    mockFeedResult = {
      data: { date: "2026-08-26", members: [] },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByText("아직 기록이 없어요")).toBeInTheDocument();
  });

  it("shows completed checkmark for member who answered all questions", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    // 리더 answered both questions
    expect(screen.getByRole("img", { name: "모두 작성 완료" })).toBeInTheDocument();
  });

  it("shows 'no entry' text for member with null entry", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByText("아직 오늘의 기록을 남기지 않았어요.")).toBeInTheDocument();
  });

  it("shows partial progress for member with partial entry", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    // 민수 answered 1/2
    expect(screen.getByText("1/2 작성")).toBeInTheDocument();
  });

  it("renders answer bodies and question snapshots", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByText("공원 산책")).toBeInTheDocument();
    expect(screen.getAllByText("오늘 가장 좋았던 순간은?").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the feed list with accessible label", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByRole("list", { name: "오늘의 기록 목록" })).toBeInTheDocument();
  });
});
