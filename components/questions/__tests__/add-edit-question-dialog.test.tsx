import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddEditQuestionDialog from "../add-edit-question-dialog";

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  isPending: false,
  error: null,
  onSubmit: jest.fn(),
};

describe("AddEditQuestionDialog — add mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is not rendered when open=false", () => {
    renderWithQuery(
      <AddEditQuestionDialog {...defaultProps} open={false} mode="add" />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders with correct title for add mode", () => {
    renderWithQuery(<AddEditQuestionDialog {...defaultProps} mode="add" />);
    expect(screen.getByRole("heading", { name: "질문 추가하기" })).toBeInTheDocument();
  });

  it("submit button is disabled when input is empty", () => {
    renderWithQuery(<AddEditQuestionDialog {...defaultProps} mode="add" />);
    expect(screen.getByRole("button", { name: "추가" })).toBeDisabled();
  });

  it("enables submit when question is typed", async () => {
    const user = userEvent.setup();
    renderWithQuery(<AddEditQuestionDialog {...defaultProps} mode="add" />);
    await user.type(screen.getByLabelText("질문 내용"), "오늘 기분은?");
    expect(screen.getByRole("button", { name: "추가" })).toBeEnabled();
  });

  it("calls onSubmit with trimmed value", async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <AddEditQuestionDialog {...defaultProps} mode="add" onSubmit={onSubmit} />
    );
    await user.type(screen.getByLabelText("질문 내용"), "  오늘 기분은?  ");
    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(onSubmit).toHaveBeenCalledWith("오늘 기분은?");
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(
      <AddEditQuestionDialog {...defaultProps} mode="add" onOpenChange={onOpenChange} />
    );
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error message when error prop is set", () => {
    renderWithQuery(
      <AddEditQuestionDialog
        {...defaultProps}
        mode="add"
        error={new Error("최대 4개까지만 추가할 수 있어요.")}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("최대 4개까지만 추가할 수 있어요.");
  });

  it("disables inputs and shows pending label while submitting", () => {
    renderWithQuery(
      <AddEditQuestionDialog {...defaultProps} mode="add" isPending={true} />
    );
    expect(screen.getByLabelText("질문 내용")).toBeDisabled();
    expect(screen.getByRole("button", { name: "추가 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });
});

describe("AddEditQuestionDialog — edit mode", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders with correct title for edit mode", () => {
    renderWithQuery(<AddEditQuestionDialog {...defaultProps} mode="edit" />);
    expect(screen.getByRole("heading", { name: "질문 수정하기" })).toBeInTheDocument();
  });

  it("pre-fills input with initialValue", () => {
    renderWithQuery(
      <AddEditQuestionDialog {...defaultProps} mode="edit" initialValue="기존 질문이에요" />
    );
    expect(screen.getByLabelText("질문 내용")).toHaveValue("기존 질문이에요");
  });

  it("shows pending label '저장 중...' while submitting", () => {
    renderWithQuery(
      <AddEditQuestionDialog
        {...defaultProps}
        mode="edit"
        initialValue="기존 질문이에요"
        isPending={true}
      />
    );
    expect(screen.getByRole("button", { name: "저장 중..." })).toBeDisabled();
  });
});
