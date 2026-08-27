import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiaryQuestionCard from "../diary-question-card";
import type { DiaryAnswer } from "@/lib/api/diary";

const question = {
  id: "q1",
  question: "오늘 가장 기뻤던 일은?",
  questionType: "CUSTOM" as const,
};

const dailyQuestion = {
  id: "dq1",
  question: "오늘 스스로를 칭찬하고 싶은 순간은?",
  questionType: "DAILY" as const,
};

const answer: DiaryAnswer = {
  id: "a1",
  diaryEntryId: "e1",
  questionType: "CUSTOM",
  groupQuestionId: "q1",
  body: "가족과 저녁 산책",
  questionSnapshot: "오늘 가장 기뻤던 일은?",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

describe("DiaryQuestionCard", () => {
  it("renders collapsed by default showing question text", () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByText("오늘 가장 기뻤던 일은?")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "답변하기" })).not.toBeInTheDocument();
  });

  it("expands to show textarea and submit button when clicked", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));

    expect(screen.getByRole("textbox", { name: "질문 1 답변 입력" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "답변하기" })).toBeInTheDocument();
  });

  it("collapses back when clicked again", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    const toggle = screen.getByRole("button", { name: /질문 1/i });
    await userEvent.click(toggle);
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await userEvent.click(toggle);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("answer button is disabled when textarea is empty", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    expect(screen.getByRole("button", { name: "답변하기" })).toBeDisabled();
  });

  it("enables answer button when user types text", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "좋은 하루였어요");

    expect(screen.getByRole("button", { name: "답변하기" })).toBeEnabled();
  });

  it("calls onSubmit with questionId and trimmed body, then collapses", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "  좋은 하루  ");
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ id: "q1", questionType: "CUSTOM" }),
        "좋은 하루"
      );
    });

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });

  it("shows checkmark and no textarea when question is completed", () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={answer}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByLabelText("작성 완료")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("expands completed question with existing answer pre-filled", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={answer}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));

    const textarea = screen.getByRole("textbox", { name: "질문 1 답변 입력" });
    expect(textarea).toHaveValue("가족과 저녁 산책");
    expect(screen.getByRole("button", { name: "수정하기" })).toBeInTheDocument();
  });

  it("does not show emoji-add button", () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /이모지/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /😊/i })).not.toBeInTheDocument();
  });

  it("does not show placeholder text in textarea", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    const textarea = screen.getByRole("textbox");
    expect(textarea).not.toHaveAttribute("placeholder");
  });

  it("keeps card expanded if onSubmit throws", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("network error"));

    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "오늘도 좋은 날");
    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders daily question label and special styling without extra chip/help button", () => {
    render(
      <DiaryQuestionCard
        question={dailyQuestion}
        index={4}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /오늘의 질문/i })).toBeInTheDocument();
    expect(screen.queryByText(/AI question/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /\?/ })).not.toBeInTheDocument();
  });

  it("uses daily question textarea label when expanded", async () => {
    render(
      <DiaryQuestionCard
        question={dailyQuestion}
        index={4}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /오늘의 질문/i }));
    expect(screen.getByRole("textbox", { name: "오늘의 질문 답변 입력" })).toBeInTheDocument();
  });
});
