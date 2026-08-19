import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeaveGroupDialog from "../leave-group-dialog";
import type { Group } from "@/lib/api/groups";

// ── fixtures ────────────────────────────────────────────────────────────────

const leaderUser = { id: "u1", name: "리더", profileImageKey: null };
const memberUser = { id: "u2", name: "멤버A", profileImageKey: null };
const member2User = { id: "u3", name: "멤버B", profileImageKey: null };

const makeGroup = (overrides?: Partial<Group>): Group => ({
  id: "g1",
  name: "우리 가족",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  memberships: [
    { id: "m1", userId: "u1", role: "LEADER", createdAt: "", updatedAt: "", user: leaderUser },
    { id: "m2", userId: "u2", role: "MEMBER", createdAt: "", updatedAt: "", user: memberUser },
    { id: "m3", userId: "u3", role: "MEMBER", createdAt: "", updatedAt: "", user: member2User },
  ],
  ...overrides,
});

const soloLeaderGroup = (): Group =>
  makeGroup({
    memberships: [
      { id: "m1", userId: "u1", role: "LEADER", createdAt: "", updatedAt: "", user: leaderUser },
    ],
  });

// ── mocks ────────────────────────────────────────────────────────────────────

const mockLeaveGroup = jest.fn();
const mockTransferLeadership = jest.fn();

jest.mock("@/hooks/use-groups", () => ({
  useLeaveGroupMutation: () => ({
    mutateAsync: mockLeaveGroup,
    isPending: false,
  }),
  useTransferLeadershipMutation: () => ({
    mutateAsync: mockTransferLeadership,
    isPending: false,
  }),
  useActiveGroupQuery: () => ({
    activeGroupId: "g1",
    groups: [],
    activeGroup: null,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

// ── helpers ──────────────────────────────────────────────────────────────────

const renderDialog = (
  open: boolean,
  group: Group,
  currentUserId: string,
  onOpenChange = jest.fn()
) => {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <LeaveGroupDialog
        open={open}
        onOpenChange={onOpenChange}
        group={group}
        currentUserId={currentUserId}
      />
    </QueryClientProvider>
  );
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("LeaveGroupDialog — member flow", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders simple confirmation for a regular member", () => {
    renderDialog(true, makeGroup(), "u2");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/정말로/)).toBeInTheDocument();
    expect(screen.getByText("우리 가족")).toBeInTheDocument();
    expect(screen.queryByText(/새로운 리더/)).not.toBeInTheDocument();
  });

  it("calls leaveGroup on confirm for member", async () => {
    mockLeaveGroup.mockResolvedValue(undefined);
    const onOpenChange = jest.fn();
    renderDialog(true, makeGroup(), "u2", onOpenChange);

    await userEvent.click(screen.getByRole("button", { name: /그룹 나가기/ }));

    await waitFor(() => expect(mockLeaveGroup).toHaveBeenCalledWith("g1"));
    expect(mockTransferLeadership).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes dialog on 취소 button click", async () => {
    const onOpenChange = jest.fn();
    renderDialog(true, makeGroup(), "u2", onOpenChange);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not render when open=false", () => {
    renderDialog(false, makeGroup(), "u2");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("LeaveGroupDialog — leader flow with other members", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows successor selection UI for leader with other members", () => {
    renderDialog(true, makeGroup(), "u1");
    expect(screen.getByText(/새로운 리더 선택/)).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /멤버A/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /멤버B/ })).toBeInTheDocument();
  });

  it("auto-selects the first other member as successor", () => {
    renderDialog(true, makeGroup(), "u1");
    const firstOption = screen.getByRole("option", { name: /멤버A/ });
    expect(firstOption).toHaveAttribute("aria-selected", "true");
  });

  it("allows leader to select a different successor", async () => {
    renderDialog(true, makeGroup(), "u1");
    const memberBOption = screen.getByRole("option", { name: /멤버B/ });
    await userEvent.click(memberBOption);
    expect(memberBOption).toHaveAttribute("aria-selected", "true");
  });

  it("transfers leadership then leaves on confirm", async () => {
    mockTransferLeadership.mockResolvedValue({});
    mockLeaveGroup.mockResolvedValue(undefined);
    const onOpenChange = jest.fn();
    renderDialog(true, makeGroup(), "u1", onOpenChange);

    await userEvent.click(screen.getByRole("button", { name: /그룹 나가기/ }));

    await waitFor(() =>
      expect(mockTransferLeadership).toHaveBeenCalledWith({
        groupId: "g1",
        newLeaderId: "u2", // first other member
      })
    );
    expect(mockLeaveGroup).toHaveBeenCalledWith("g1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses selected successor when leader picks a different member", async () => {
    mockTransferLeadership.mockResolvedValue({});
    mockLeaveGroup.mockResolvedValue(undefined);
    renderDialog(true, makeGroup(), "u1");

    // select 멤버B
    await userEvent.click(screen.getByRole("option", { name: /멤버B/ }));
    await userEvent.click(screen.getByRole("button", { name: /그룹 나가기/ }));

    await waitFor(() =>
      expect(mockTransferLeadership).toHaveBeenCalledWith({
        groupId: "g1",
        newLeaderId: "u3",
      })
    );
  });

  it("shows error message when leave fails", async () => {
    mockTransferLeadership.mockResolvedValue({});
    mockLeaveGroup.mockRejectedValue(new Error("서버 오류"));
    renderDialog(true, makeGroup(), "u1");

    await userEvent.click(screen.getByRole("button", { name: /그룹 나가기/ }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert")).toHaveTextContent("서버 오류");
  });
});

describe("LeaveGroupDialog — solo leader flow", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows simple confirmation for leader with no other members", () => {
    renderDialog(true, soloLeaderGroup(), "u1");
    expect(screen.getByText(/정말로/)).toBeInTheDocument();
    expect(screen.queryByText(/새로운 리더 선택/)).not.toBeInTheDocument();
    expect(screen.getByText(/마지막 멤버/)).toBeInTheDocument();
  });

  it("leaves without transferring leadership", async () => {
    mockLeaveGroup.mockResolvedValue(undefined);
    renderDialog(true, soloLeaderGroup(), "u1");
    await userEvent.click(screen.getByRole("button", { name: /그룹 나가기/ }));

    await waitFor(() => expect(mockLeaveGroup).toHaveBeenCalledWith("g1"));
    expect(mockTransferLeadership).not.toHaveBeenCalled();
  });
});
