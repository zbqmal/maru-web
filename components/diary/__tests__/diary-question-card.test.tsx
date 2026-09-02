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

const createFile = (name: string, type: string, sizeInBytes = 1024) =>
  new File([new Uint8Array(sizeInBytes)], name, { type });

describe("DiaryQuestionCard", () => {
  beforeEach(() => {
    window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

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
        "좋은 하루",
        [],
        expect.any(Function)
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
    expect(screen.queryByRole("button", { name: "?" })).not.toBeInTheDocument();
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

  it("shows a photo picker when expanded", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));

    expect(screen.getByLabelText("사진 첨부하기")).toBeInTheDocument();
  });

  it("shows a photo preview after selecting a file and allows removing it", async () => {
    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={jest.fn()}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    const file = createFile("photo.png", "image/png");
    await userEvent.upload(screen.getByLabelText("사진 첨부하기"), file);

    expect(screen.getByAltText("첨부한 사진 미리보기 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "사진 1 삭제" }));
    expect(screen.queryByAltText("첨부한 사진 미리보기 1")).not.toBeInTheDocument();
  });

  it("clears selected photos when the card is collapsed", async () => {
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
    await userEvent.upload(
      screen.getByLabelText("사진 첨부하기"),
      createFile("photo.png", "image/png")
    );
    expect(screen.getByAltText("첨부한 사진 미리보기 1")).toBeInTheDocument();

    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(screen.queryByAltText("첨부한 사진 미리보기 1")).not.toBeInTheDocument();
  });

  it("clears selected photos after a successful submit", async () => {
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
    await userEvent.type(screen.getByRole("textbox"), "오늘의 사진과 함께");
    await userEvent.upload(
      screen.getByLabelText("사진 첨부하기"),
      createFile("photo.png", "image/png")
    );
    expect(screen.getByAltText("첨부한 사진 미리보기 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    expect(screen.queryByAltText("첨부한 사진 미리보기 1")).not.toBeInTheDocument();
  });

  it("passes selected photos to submit and shows retry state when upload fails", async () => {
    const onSubmit = jest
      .fn()
      .mockImplementationOnce(async (_question, _body, photos, onPhotoUploadStateChange) => {
        onPhotoUploadStateChange(photos[0].id, { status: "failed", progress: 0 });
        throw new Error("upload failed");
      })
      .mockResolvedValueOnce(undefined);

    render(
      <DiaryQuestionCard
        question={question}
        index={0}
        existingAnswer={undefined}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /질문 1/i }));
    await userEvent.type(screen.getByRole("textbox"), "사진과 함께 기록");
    const photo = createFile("photo.png", "image/png");
    await userEvent.upload(screen.getByLabelText("사진 첨부하기"), photo);

    await userEvent.click(screen.getByRole("button", { name: "답변하기" }));

    await waitFor(() => expect(screen.getByText("업로드 실패")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent(
      "답변 저장 또는 사진 업로드에 실패했어요. 다시 시도해주세요."
    );
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeEnabled();
    expect(onSubmit).toHaveBeenCalledWith(
      question,
      "사진과 함께 기록",
      [expect.objectContaining({ file: photo })],
      expect.any(Function)
    );

    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await waitFor(() => expect(screen.queryByRole("textbox")).not.toBeInTheDocument());
    expect(onSubmit).toHaveBeenCalledTimes(2);
  });
});
