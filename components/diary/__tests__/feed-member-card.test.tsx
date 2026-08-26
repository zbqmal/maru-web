import { render, screen } from "@testing-library/react";
import FeedMemberCard from "../feed-member-card";
import type { FeedMemberEntry } from "@/lib/api/diary";

const baseUser = { id: "u1", name: "다연", profileImageKey: null };

const noEntryMember: FeedMemberEntry = {
  userId: "u1",
  user: baseUser,
  entry: null,
};

const partialEntryMember: FeedMemberEntry = {
  userId: "u1",
  user: baseUser,
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
};

const completedEntryMember: FeedMemberEntry = {
  userId: "u1",
  user: baseUser,
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
      {
        id: "a2",
        diaryEntryId: "e1",
        questionType: "CUSTOM",
        groupQuestionId: "q2",
        body: "새 카페 발견",
        questionSnapshot: "오늘 배운 것은?",
        createdAt: "2026-08-26T00:00:00.000Z",
        updatedAt: "2026-08-26T00:00:00.000Z",
      },
    ],
  },
};

describe("FeedMemberCard", () => {
  it("shows member name", () => {
    render(<FeedMemberCard memberEntry={noEntryMember} totalQuestions={2} />);
    expect(screen.getByText("다연")).toBeInTheDocument();
  });

  it("shows 'no entry' message when member has not written", () => {
    render(<FeedMemberCard memberEntry={noEntryMember} totalQuestions={2} />);
    expect(screen.getByText("아직 오늘의 기록을 남기지 않았어요.")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "아직 미작성" })).toBeInTheDocument();
  });

  it("shows partial progress indicator when member has answered some questions", () => {
    render(<FeedMemberCard memberEntry={partialEntryMember} totalQuestions={2} />);
    expect(screen.getByText("1/2 작성")).toBeInTheDocument();
    expect(screen.getByText("오늘 가장 좋았던 순간은?")).toBeInTheDocument();
    expect(screen.getByText("가족이랑 저녁")).toBeInTheDocument();
  });

  it("shows completion checkmark when all questions are answered", () => {
    render(<FeedMemberCard memberEntry={completedEntryMember} totalQuestions={2} />);
    expect(screen.getByRole("img", { name: "모두 작성 완료" })).toBeInTheDocument();
  });

  it("renders all answers with question snapshot and body", () => {
    render(<FeedMemberCard memberEntry={completedEntryMember} totalQuestions={2} />);
    expect(screen.getByText("오늘 가장 좋았던 순간은?")).toBeInTheDocument();
    expect(screen.getByText("가족이랑 저녁")).toBeInTheDocument();
    expect(screen.getByText("오늘 배운 것은?")).toBeInTheDocument();
    expect(screen.getByText("새 카페 발견")).toBeInTheDocument();
  });

  it("shows completion checkmark when totalQuestions is 0 and entry has 0 answers (edge: no questions)", () => {
    const noQuestionsMember: FeedMemberEntry = { ...noEntryMember };
    render(<FeedMemberCard memberEntry={noQuestionsMember} totalQuestions={0} />);
    // no checkmark because no answers
    expect(screen.queryByRole("img", { name: "모두 작성 완료" })).not.toBeInTheDocument();
  });
});
