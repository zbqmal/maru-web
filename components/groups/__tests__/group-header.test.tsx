import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GroupHeader from "../group-header";
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

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

describe("GroupHeader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActiveGroupQueryResult = {
      activeGroup: mockGroup,
      isLoading: false,
      isError: false,
    };
  });

  it("renders the group name", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByText("우리 가족")).toBeInTheDocument();
  });

  it("renders the '선택된 그룹' label", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByText("선택된 그룹")).toBeInTheDocument();
  });

  it("renders the correct member count", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByText("멤버 2명")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByText(/함께한 하루들을 기록하고 있어요/)).toBeInTheDocument();
  });

  it("renders group info region landmark", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByRole("region", { name: "선택된 그룹 정보" })).toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    mockActiveGroupQueryResult = { activeGroup: null, isLoading: true, isError: false };
    const { container } = renderWithQuery(<GroupHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when there is no active group", () => {
    mockActiveGroupQueryResult = { activeGroup: null, isLoading: false, isError: false };
    const { container } = renderWithQuery(<GroupHeader />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the group avatar with the correct fallback", () => {
    renderWithQuery(<GroupHeader />);
    expect(screen.getByRole("img", { name: "우리 가족" })).toBeInTheDocument();
  });
});
