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

const mockDeletePhotoMutate = jest.fn();

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => ({ data: { id: "u1", email: "leader@example.com", name: "리더" } }),
}));

jest.mock("@/hooks/use-diary-photos", () => ({
  useDeleteDiaryPhotoMutation: () => ({
    mutate: mockDeletePhotoMutate,
    isPending: false,
    variables: undefined,
  }),
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

  it("renders completed member answers without a status indicator", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByRole("list", { name: "리더의 답변 목록" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows 'no entry' text for member with null entry", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByText("아직 오늘의 기록을 남기지 않았어요.")).toBeInTheDocument();
  });

  it("renders partial member answers without progress text", () => {
    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);
    expect(screen.getByRole("list", { name: "민수의 답변 목록" })).toBeInTheDocument();
    expect(screen.queryByText("1/2 작성")).not.toBeInTheDocument();
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

  it("allows the current user to remove their own photo but not another member's", async () => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "https://media.example.test";
    const photo = {
      id: "p1",
      diaryEntryId: "e1",
      uploadedByUserId: "u1",
      storageKey: "photo-1.png",
      mimeType: "image/png" as const,
      width: 800,
      height: 600,
      displayOrder: 0,
      sizeBytes: 1024,
      createdAt: "2026-08-26T00:00:00.000Z",
    };
    mockFeedResult = {
      data: {
        date: "2026-08-26",
        members: [
          { ...feedData.members[0], entry: { ...feedData.members[0].entry!, photos: [photo] } },
          {
            ...feedData.members[2],
            entry: {
              ...feedData.members[2].entry!,
              photos: [{ ...photo, id: "p2", diaryEntryId: "e3", uploadedByUserId: "u3" }],
            },
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    };

    render(<GroupDailyFeed groupId="g1" date="2026-08-26" totalQuestions={2} />);

    // 리더 (current user) can remove their own photo.
    const leaderCard = screen.getByLabelText("리더의 오늘 기록");
    const removeButton = leaderCard.querySelector('button[aria-label="사진 1 삭제"]');
    expect(removeButton).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(removeButton!);
    expect(mockDeletePhotoMutate).toHaveBeenCalledWith({ diaryEntryId: "e1", photoId: "p1" });

    // 민수 (not the current user) cannot remove their photo.
    const minsuCard = screen.getByLabelText("민수의 오늘 기록");
    expect(minsuCard.querySelector('button[aria-label="사진 1 삭제"]')).not.toBeInTheDocument();
  });
});
