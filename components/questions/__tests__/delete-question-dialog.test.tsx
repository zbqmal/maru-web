import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DeleteQuestionDialog from "../delete-question-dialog";

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const defaultProps = {
  open: true,
  onOpenChange: jest.fn(),
  question: "오늘 가장 행복했던 순간은?",
  isPending: false,
  error: null,
  onConfirm: jest.fn(),
};

describe("DeleteQuestionDialog", () => {
  beforeEach(() => jest.clearAllMocks());

  it("is not rendered when open=false", () => {
    renderWithQuery(<DeleteQuestionDialog {...defaultProps} open={false} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the question text", () => {
    renderWithQuery(<DeleteQuestionDialog {...defaultProps} />);
    expect(
      screen.getByText(/오늘 가장 행복했던 순간은?/)
    ).toBeInTheDocument();
  });

  it("calls onConfirm when 삭제 is clicked", async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<DeleteQuestionDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onOpenChange(false) when 취소 is clicked", async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup();
    renderWithQuery(<DeleteQuestionDialog {...defaultProps} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error message", () => {
    renderWithQuery(
      <DeleteQuestionDialog
        {...defaultProps}
        error={new Error("삭제에 실패했어요.")}
      />
    );
    expect(screen.getByRole("alert")).toHaveTextContent("삭제에 실패했어요.");
  });

  it("shows pending state while deleting", () => {
    renderWithQuery(<DeleteQuestionDialog {...defaultProps} isPending={true} />);
    expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });
});
