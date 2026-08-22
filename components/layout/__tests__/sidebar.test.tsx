import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Sidebar from "../sidebar";
import type { Group } from "@/lib/api/groups";
import type { AuthUser } from "@/lib/api/auth";

const mockCurrentUser: AuthUser = {
  id: "u1",
  name: "홍길동",
  email: "user@example.com",
  birthday: null,
  profileImageKey: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

const mockGroup: Group = {
  id: "g1",
  name: "우리 가족",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
  memberships: [
    {
      id: "m1",
      userId: "u1",
      role: "LEADER",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      user: { id: "u1", name: "홍길동", profileImageKey: null },
    },
    {
      id: "m2",
      userId: "u2",
      role: "MEMBER",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
      user: { id: "u2", name: "다연", profileImageKey: null },
    },
  ],
};

let mockActiveGroupQueryResult: {
  activeGroup: Group | null;
  isLoading: boolean;
  isError: boolean;
} = {
  activeGroup: mockGroup,
  isLoading: false,
  isError: false,
};

jest.mock("@/hooks/use-groups", () => ({
  useActiveGroupQuery: () => mockActiveGroupQueryResult,
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/home",
}));

jest.mock("@/components/group-invitations/invite-member-dialog", () => ({
  __esModule: true,
  default: ({ open, onOpenChange, groupId }: { open: boolean; onOpenChange: (v: boolean) => void; groupId: string }) =>
    open ? <div data-testid="invite-dialog" data-group-id={groupId}>
      <button onClick={() => onOpenChange(false)}>close-invite</button>
    </div> : null,
}));

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("Sidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroupQueryResult = {
      activeGroup: mockGroup,
      isLoading: false,
      isError: false,
    };
  });

  it("renders the MARU logo", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByText("MARU")).toBeInTheDocument();
  });

  it("renders the nav items", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByRole("link", { name: /오늘의 다이어리/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /달력 보기/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /질문 설정하기/ })).toBeInTheDocument();
  });

  it("renders group members from the active group", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByText("홍길동 (나)")).toBeInTheDocument();
    expect(screen.getByText("다연")).toBeInTheDocument();
  });

  it("renders the leader crown icon for the group leader", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByLabelText("그룹 리더")).toBeInTheDocument();
  });

  it("does not show placeholder members when there is no active group", () => {
    mockActiveGroupQueryResult = { activeGroup: null, isLoading: false, isError: false };
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.queryByText("다연")).not.toBeInTheDocument();
    expect(screen.getByText("속한 그룹이 없어요")).toBeInTheDocument();
  });

  it("shows loading skeletons while loading", () => {
    mockActiveGroupQueryResult = { activeGroup: null, isLoading: true, isError: false };
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByRole("list", { name: "멤버 목록 불러오는 중" })).toBeInTheDocument();
  });

  it("renders the member list landmark", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByRole("list", { name: "그룹 멤버 목록" })).toBeInTheDocument();
  });

  it("shows the invite button for the group leader", () => {
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.getByRole("button", { name: "멤버 초대" })).toBeInTheDocument();
  });

  it("does not show the invite button for a regular member", () => {
    mockActiveGroupQueryResult = {
      activeGroup: {
        ...mockGroup,
        memberships: [
          {
            id: "m1",
            userId: "u1",
            role: "MEMBER",
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
            user: { id: "u1", name: "홍길동", profileImageKey: null },
          },
        ],
      },
      isLoading: false,
      isError: false,
    };
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.queryByRole("button", { name: "멤버 초대" })).not.toBeInTheDocument();
  });

  it("does not show the invite button when there is no active group", () => {
    mockActiveGroupQueryResult = { activeGroup: null, isLoading: false, isError: false };
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.queryByRole("button", { name: "멤버 초대" })).not.toBeInTheDocument();
  });

  it("opens the invite dialog when the invite button is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    expect(screen.queryByTestId("invite-dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "멤버 초대" }));
    expect(screen.getByTestId("invite-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("invite-dialog")).toHaveAttribute("data-group-id", "g1");
  });

  it("closes the invite dialog when the dialog signals close", async () => {
    const user = userEvent.setup();
    renderWithQuery(<Sidebar currentUser={mockCurrentUser} />);
    await user.click(screen.getByRole("button", { name: "멤버 초대" }));
    expect(screen.getByTestId("invite-dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-invite" }));
    expect(screen.queryByTestId("invite-dialog")).not.toBeInTheDocument();
  });
});
