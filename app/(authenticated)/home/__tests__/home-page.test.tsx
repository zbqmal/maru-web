import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "../page";
import type { Group } from "@/lib/api/groups";

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
      user: { id: "u1", name: "나", profileImageKey: null },
    },
  ],
};

let mockGroupsQueryResult: {
  data: Group[] | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: jest.Mock;
} = {
  data: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

let mockActiveGroupId: string | null = null;

jest.mock("@/hooks/use-groups", () => ({
  useActiveGroupQuery: () => ({
    groups: mockGroupsQueryResult.data,
    activeGroupId: mockActiveGroupId,
    activeGroup: mockGroupsQueryResult.data?.find((group) => group.id === mockActiveGroupId) ?? null,
    isLoading: mockGroupsQueryResult.isLoading,
    isError: mockGroupsQueryResult.isError,
    refetch: mockGroupsQueryResult.refetch,
  }),
  useCreateGroupMutation: () => ({ mutate: jest.fn(), isPending: false, error: null }),
}));

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("HomePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroupId = null;
    mockGroupsQueryResult = {
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    };
  });

  it("renders the page heading", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByRole("heading", { name: "홈" })).toBeInTheDocument();
  });

  it("shows the no-group empty state when user has no groups", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByText("아직 속한 그룹이 없어요")).toBeInTheDocument();
    expect(screen.getByText(/그룹을 만들거나 초대 링크로 참여하면/)).toBeInTheDocument();
  });

  it("renders the create group button in empty state", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByRole("button", { name: /그룹 만들기/ })).toBeInTheDocument();
  });

  it("renders the join group button in empty state", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByRole("button", { name: /그룹 참가하기/ })).toBeInTheDocument();
  });

  it("opens create group dialog when 그룹 만들기 is clicked in empty state", async () => {
    const user = userEvent.setup();
    renderWithQuery(<HomePage />);
    await user.click(screen.getByRole("button", { name: /그룹 만들기/ }));
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("shows the diary placeholder and no group selector when user has groups", () => {
    mockGroupsQueryResult = { data: [mockGroup], isLoading: false, isError: false, refetch: jest.fn() };
    mockActiveGroupId = "g1";
    renderWithQuery(<HomePage />);
    expect(screen.getByText(/오늘의 다이어리 기능은 곧 추가될 예정이에요/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "그룹 선택" })).not.toBeInTheDocument();
  });

  it("hides the no-group empty state when the user has an active group", () => {
    mockGroupsQueryResult = { data: [mockGroup], isLoading: false, isError: false, refetch: jest.fn() };
    mockActiveGroupId = "g1";
    renderWithQuery(<HomePage />);
    expect(screen.queryByText("아직 속한 그룹이 없어요")).not.toBeInTheDocument();
  });

  it("renders the streak placeholder card", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByText("연속 기록 현황")).toBeInTheDocument();
  });

  it("renders the calendar placeholder card", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByText("이번 달 기록")).toBeInTheDocument();
  });

  it("renders the right sidebar summary landmark", () => {
    renderWithQuery(<HomePage />);
    expect(screen.getByRole("complementary", { name: "요약 정보" })).toBeInTheDocument();
  });
});
