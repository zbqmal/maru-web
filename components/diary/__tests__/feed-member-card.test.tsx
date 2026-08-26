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
    expect(screen.getByLabelText("다연의 오늘 기록")).toBeInTheDocument();
    expect(screen.getByText("다")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders a member's answers in an accessible answer list", () => {
    render(<FeedMemberCard memberEntry={partialEntryMember} totalQuestions={2} />);
    const answerList = screen.getByRole("list", { name: "다연의 답변 목록" });
    expect(answerList).toBeInTheDocument();
    expect(screen.getByText("오늘 가장 좋았던 순간은?")).toBeInTheDocument();
    expect(screen.getByText("가족이랑 저녁")).toBeInTheDocument();
    expect(screen.queryByText("1/2 작성")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("uses the completed card styling when all questions are answered", () => {
    render(<FeedMemberCard memberEntry={completedEntryMember} totalQuestions={2} />);
    expect(screen.getByLabelText("다연의 오늘 기록")).toHaveClass("border-success/30");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders all answers with question snapshot and body", () => {
    render(<FeedMemberCard memberEntry={completedEntryMember} totalQuestions={2} />);
    expect(screen.getByText("오늘 가장 좋았던 순간은?")).toBeInTheDocument();
    expect(screen.getByText("가족이랑 저녁")).toBeInTheDocument();
    expect(screen.getByText("오늘 배운 것은?")).toBeInTheDocument();
    expect(screen.getByText("새 카페 발견")).toBeInTheDocument();
  });

  it("uses a horizontal member column and indents answer bodies", () => {
    render(<FeedMemberCard memberEntry={partialEntryMember} totalQuestions={2} />);
    const card = screen.getByLabelText("다연의 오늘 기록");
    const content = card.firstElementChild;
    const memberColumn = content?.firstElementChild;
    const answerList = screen.getByRole("list", { name: "다연의 답변 목록" });
    const answerRow = answerList.firstElementChild;

    expect(content).toHaveClass("flex", "gap-10");
    expect(memberColumn).toHaveClass("w-30", "items-start");
    expect(answerRow).toHaveClass("gap-2", "py-1");
    expect(screen.getByText("가족이랑 저녁")).toHaveClass("pl-2");
  });

  it("does not use completed styling when totalQuestions is 0 and entry has 0 answers", () => {
    const noQuestionsMember: FeedMemberEntry = { ...noEntryMember };
    render(<FeedMemberCard memberEntry={noQuestionsMember} totalQuestions={0} />);
    expect(screen.getByLabelText("다연의 오늘 기록")).toHaveClass("border-border");
  });
});
