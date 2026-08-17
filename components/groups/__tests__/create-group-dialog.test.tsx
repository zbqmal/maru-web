import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreateGroupDialog from "../create-group-dialog";

const mockCreate = jest.fn();
let mockIsPending = false;
let mockError: Error | null = null;

jest.mock("@/hooks/use-groups", () => ({
  useCreateGroupMutation: () => ({
    mutate: mockCreate,
    isPending: mockIsPending,
    error: mockError,
  }),
}));

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("CreateGroupDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
    mockError = null;
  });

  it("is not rendered when open=false", () => {
    renderWithQuery(<CreateGroupDialog open={false} onOpenChange={jest.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with input when open=true", () => {
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("그룹 이름")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "만들기" })).toBeDisabled();
  });

  it("enables submit button when name is typed", async () => {
    const user = userEvent.setup();
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={jest.fn()} />);
    await user.type(screen.getByLabelText("그룹 이름"), "우리 가족");
    expect(screen.getByRole("button", { name: "만들기" })).toBeEnabled();
  });

  it("calls create with trimmed name on submit", async () => {
    const user = userEvent.setup();
    mockCreate.mockImplementation((_input: unknown, options: { onSuccess: () => void }) => {
      options.onSuccess();
    });

    const onOpenChange = jest.fn();
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={onOpenChange} />);

    await user.type(screen.getByLabelText("그룹 이름"), "  우리 가족  ");
    await user.click(screen.getByRole("button", { name: "만들기" }));

    expect(mockCreate).toHaveBeenCalledWith(
      { name: "우리 가족" },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows error message when mutation fails", () => {
    mockError = new Error("그룹 생성에 실패했어요");
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("그룹 생성에 실패했어요");
  });

  it("shows pending state and disables inputs during submission", async () => {
    mockIsPending = true;
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={jest.fn()} />);
    expect(screen.getByLabelText("그룹 이름")).toBeDisabled();
    expect(screen.getByRole("button", { name: "생성 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });

  it("closes dialog via close button (X)", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderWithQuery(<CreateGroupDialog open={true} onOpenChange={onOpenChange} />);
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
