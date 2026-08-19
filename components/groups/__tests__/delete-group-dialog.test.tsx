import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DeleteGroupDialog from "../delete-group-dialog";
import type { Group } from "@/lib/api/groups";

const leaderUser = { id: "u1", name: "리더", profileImageKey: null };
const memberUser = { id: "u2", name: "멤버", profileImageKey: null };

const makeGroup = (): Group => ({
  id: "g1",
  name: "우리 가족",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  memberships: [
    { id: "m1", userId: "u1", role: "LEADER", createdAt: "", updatedAt: "", user: leaderUser },
    { id: "m2", userId: "u2", role: "MEMBER", createdAt: "", updatedAt: "", user: memberUser },
  ],
});

const mockDeleteGroup = jest.fn();

jest.mock("@/hooks/use-groups", () => ({
  useDeleteGroupMutation: () => ({
    mutateAsync: mockDeleteGroup,
    isPending: false,
  }),
}));

const renderDialog = (currentUserId: string, onOpenChange = jest.fn()) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <DeleteGroupDialog
        open
        onOpenChange={onOpenChange}
        group={makeGroup()}
        currentUserId={currentUserId}
      />
    </QueryClientProvider>
  );
};

describe("DeleteGroupDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requires exact group-name confirmation before enabling deletion", async () => {
    const user = userEvent.setup();
    renderDialog("u1");

    const deleteButton = screen.getByRole("button", { name: "그룹 삭제" });
    const input = screen.getByLabelText("그룹 이름 확인");

    expect(deleteButton).toBeDisabled();
    await user.type(input, "우리");
    expect(deleteButton).toBeDisabled();

    await user.clear(input);
    await user.type(input, "우리 가족");
    expect(deleteButton).toBeEnabled();
  });

  it("submits delete request and closes on success", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    mockDeleteGroup.mockResolvedValue(undefined);
    renderDialog("u1", onOpenChange);

    await user.type(screen.getByLabelText("그룹 이름 확인"), "우리 가족");
    await user.click(screen.getByRole("button", { name: "그룹 삭제" }));

    await waitFor(() => expect(mockDeleteGroup).toHaveBeenCalledWith("g1"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("shows API errors in the dialog", async () => {
    const user = userEvent.setup();
    mockDeleteGroup.mockRejectedValue(new Error("권한이 없습니다."));
    renderDialog("u1");

    await user.type(screen.getByLabelText("그룹 이름 확인"), "우리 가족");
    await user.click(screen.getByRole("button", { name: "그룹 삭제" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("권한이 없습니다."));
  });

  it("keeps deletion disabled for non-leader users", async () => {
    const user = userEvent.setup();
    renderDialog("u2");

    await user.type(screen.getByLabelText("그룹 이름 확인"), "우리 가족");
    expect(screen.getByRole("button", { name: "그룹 삭제" })).toBeDisabled();
    expect(mockDeleteGroup).not.toHaveBeenCalled();
  });
});
