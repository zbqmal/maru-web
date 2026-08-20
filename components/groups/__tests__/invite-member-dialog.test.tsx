import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InviteMemberDialog from "../invite-member-dialog";

// ── mocks ────────────────────────────────────────────────────────────────────

const mockInvite = jest.fn();
let mockIsPending = false;

jest.mock("@/hooks/use-groups", () => ({
  useInviteMemberMutation: () => ({
    mutate: mockInvite,
    isPending: mockIsPending,
  }),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const renderDialog = (open = true, onOpenChange = jest.fn(), groupId = "g1") =>
  renderWithQuery(
    <InviteMemberDialog open={open} onOpenChange={onOpenChange} groupId={groupId} />
  );

// ── tests ─────────────────────────────────────────────────────────────────────

describe("InviteMemberDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsPending = false;
  });

  it("is not rendered when open=false", () => {
    renderDialog(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders dialog with email input when open=true", () => {
    renderDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText("이메일 주소")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "초대 보내기" })).toBeDisabled();
  });

  it("enables submit button only when a valid email is entered", async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitBtn = screen.getByRole("button", { name: "초대 보내기" });
    const input = screen.getByLabelText("이메일 주소");

    await user.type(input, "notanemail");
    expect(submitBtn).toBeDisabled();

    await user.clear(input);
    await user.type(input, "valid@example.com");
    expect(submitBtn).toBeEnabled();
  });

  it("calls invite with trimmed email on submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("이메일 주소"), "  user@test.com  ");
    await user.click(screen.getByRole("button", { name: "초대 보내기" }));

    expect(mockInvite).toHaveBeenCalledWith(
      { email: "user@test.com" },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("shows success state after successful invite", async () => {
    const user = userEvent.setup();
    mockInvite.mockImplementation(
      (_input: unknown, options: { onSuccess: () => void }) => {
        options.onSuccess();
      }
    );

    renderDialog();
    await user.type(screen.getByLabelText("이메일 주소"), "alice@example.com");
    await user.click(screen.getByRole("button", { name: "초대 보내기" }));

    await waitFor(() => {
      expect(screen.getByText("초대 이메일을 보냈어요!")).toBeInTheDocument();
    });
    expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
  });

  it("shows error message when invite fails", async () => {
    const user = userEvent.setup();
    mockInvite.mockImplementation(
      (_input: unknown, options: { onError: (err: Error) => void }) => {
        options.onError(new Error("이미 초대된 이메일이에요."));
      }
    );

    renderDialog();
    await user.type(screen.getByLabelText("이메일 주소"), "taken@example.com");
    await user.click(screen.getByRole("button", { name: "초대 보내기" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("이미 초대된 이메일이에요.");
    });
  });

  it("shows pending state and disables inputs during submission", () => {
    mockIsPending = true;
    renderDialog();
    expect(screen.getByLabelText("이메일 주소")).toBeDisabled();
    expect(screen.getByRole("button", { name: "전송 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();
  });

  it("prevents submission while a request is pending", async () => {
    const user = userEvent.setup();
    mockIsPending = true;
    renderDialog();
    await user.type(screen.getByLabelText("이메일 주소"), "a@b.com");
    await user.click(screen.getByRole("button", { name: "전송 중..." }));
    expect(mockInvite).not.toHaveBeenCalled();
  });

  it("calls onOpenChange(false) when cancel is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog(true, onOpenChange);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes dialog via close button (X)", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    renderDialog(true, onOpenChange);
    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets form when reopened after success", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    mockInvite.mockImplementation(
      (_input: unknown, options: { onSuccess: () => void }) => {
        options.onSuccess();
      }
    );

    const { rerender } = renderWithQuery(
      <InviteMemberDialog open={true} onOpenChange={onOpenChange} groupId="g1" />
    );

    await user.type(screen.getByLabelText("이메일 주소"), "test@example.com");
    await user.click(screen.getByRole("button", { name: "초대 보내기" }));
    await waitFor(() => expect(screen.getByText("초대 이메일을 보냈어요!")).toBeInTheDocument());

    // Click confirm to close
    await user.click(screen.getByRole("button", { name: "확인" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    // Reopen
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <InviteMemberDialog open={true} onOpenChange={onOpenChange} groupId="g1" />
      </QueryClientProvider>
    );

    expect(screen.queryByText("초대 이메일을 보냈어요!")).not.toBeInTheDocument();
    expect(screen.getByLabelText("이메일 주소")).toBeInTheDocument();
  });
});
