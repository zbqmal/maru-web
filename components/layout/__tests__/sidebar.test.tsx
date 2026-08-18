import { render, screen } from "@testing-library/react";
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
});
