import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GroupSelector from "../group-selector";
import type { Group } from "@/lib/api/groups";

const mockGroups: Group[] = [
  {
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
        user: { id: "u1", name: "리더", profileImageKey: null },
      },
      {
        id: "m2",
        userId: "u2",
        role: "MEMBER",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
        user: { id: "u2", name: "멤버", profileImageKey: null },
      },
    ],
  },
  {
    id: "g2",
    name: "친구들",
    createdAt: "2024-01-02",
    updatedAt: "2024-01-02",
    memberships: [
      {
        id: "m3",
        userId: "u1",
        role: "MEMBER",
        createdAt: "2024-01-02",
        updatedAt: "2024-01-02",
        user: { id: "u1", name: "리더", profileImageKey: null },
      },
    ],
  },
];

let mockGroupsQueryResult: {
  data: Group[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
} = {
  data: mockGroups,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

let mockActiveGroupId: string | null = "g1";
const mockSetActiveGroupId = jest.fn((id: string | null) => {
  mockActiveGroupId = id;
});
let mockCurrentUserId = "u1";

jest.mock("@/hooks/use-groups", () => ({
  useActiveGroupQuery: () => ({
    groups: mockGroupsQueryResult.data,
    activeGroupId: mockActiveGroupId,
    activeGroup: mockGroupsQueryResult.data?.find((group) => group.id === mockActiveGroupId) ?? null,
    isLoading: mockGroupsQueryResult.isLoading,
    isError: mockGroupsQueryResult.isError,
    refetch: mockGroupsQueryResult.refetch,
  }),
}));

jest.mock("@/lib/store/active-group", () => ({
  useActiveGroupStore: (selector: (s: { activeGroupId: string | null; setActiveGroupId: (id: string | null) => void }) => unknown) =>
    selector({ activeGroupId: mockActiveGroupId, setActiveGroupId: mockSetActiveGroupId }),
}));

jest.mock("@/components/groups/create-group-dialog", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-dialog">dialog</div> : null,
}));

jest.mock("@/components/groups/leave-group-dialog", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) => (open ? <div data-testid="leave-dialog">dialog</div> : null),
}));

jest.mock("@/components/groups/delete-group-dialog", () => ({
  __esModule: true,
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="delete-dialog">dialog</div> : null,
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => ({
    data: { id: mockCurrentUserId, email: "user@example.com", name: "테스터" },
  }),
}));

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("GroupSelector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroupId = "g1";
    mockCurrentUserId = "u1";
    mockGroupsQueryResult = {
      data: mockGroups,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
  });

  it("shows loading spinner while groups are loading", () => {
    mockGroupsQueryResult = {
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    };
    renderWithQuery(<GroupSelector />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error state when groups query fails", () => {
    mockGroupsQueryResult = {
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    };
    renderWithQuery(<GroupSelector />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders active group name in the trigger button", () => {
    renderWithQuery(<GroupSelector />);
    expect(screen.getByRole("button", { name: "그룹 선택" })).toHaveTextContent("우리 가족");
    expect(screen.getByRole("img", { name: "우리 가족" })).toHaveTextContent("우");
    expect(screen.getByText("멤버 2명")).toBeInTheDocument();
  });

  it("opens dropdown on click and lists groups", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /우리 가족/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /친구들/ })).toBeInTheDocument();
  });

  it("calls setActiveGroupId when a different group is selected", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    await user.click(screen.getByRole("option", { name: /친구들/ }));
    expect(mockSetActiveGroupId).toHaveBeenCalledWith("g2");
  });

  it("opens create dialog when '새 그룹 만들기' is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    await user.click(screen.getByRole("button", { name: "새 그룹 만들기" }));
    await waitFor(() => {
      expect(screen.getByTestId("create-dialog")).toBeInTheDocument();
    });
  });

  it("shows empty message in dropdown when user has no groups", async () => {
    const user = userEvent.setup();
    mockGroupsQueryResult = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
    mockActiveGroupId = null;
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    expect(screen.getByText("속한 그룹이 없어요")).toBeInTheDocument();
  });

  it("shows delete action only when user is active-group leader", async () => {
    const user = userEvent.setup();
    const view = renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    expect(screen.getByRole("button", { name: "그룹 삭제" })).toBeInTheDocument();

    view.unmount();
    mockCurrentUserId = "u2";
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    expect(screen.queryByRole("button", { name: "그룹 삭제" })).not.toBeInTheDocument();
  });

  it("opens delete dialog when delete action is clicked", async () => {
    const user = userEvent.setup();
    renderWithQuery(<GroupSelector />);
    await user.click(screen.getByRole("button", { name: "그룹 선택" }));
    await user.click(screen.getByRole("button", { name: "그룹 삭제" }));
    await waitFor(() => {
      expect(screen.getByTestId("delete-dialog")).toBeInTheDocument();
    });
  });
});
