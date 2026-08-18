import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TopNav from "../top-nav";
import { GROUPS_QUERY_KEY } from "@/hooks/use-groups";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";

const mockReplace = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}));

jest.mock("@/lib/api/auth", () => ({
  logout: jest.fn(),
}));

jest.mock("@/components/groups/group-selector", () => ({
  __esModule: true,
  default: () => <div data-testid="top-nav-group-selector">group-selector</div>,
}));

import { logout } from "@/lib/api/auth";

const mockLogout = logout as jest.MockedFunction<typeof logout>;

const renderTopNav = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <TopNav
        currentUser={{
          id: "1",
          email: "user@example.com",
          name: "홍길동",
          birthday: null,
          profileImageKey: null,
          createdAt: "",
          updatedAt: "",
        }}
      />
    </QueryClientProvider>
  );

  return { ...view, queryClient };
};

describe("TopNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows the authenticated user's details in the menu", async () => {
    const user = userEvent.setup();
    renderTopNav();

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));

    expect(screen.getAllByText("홍길동")).toHaveLength(2);
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
  });

  it("renders the group selector in the shared top navigation", () => {
    renderTopNav();

    expect(screen.getByTestId("top-nav-group-selector")).toBeInTheDocument();
  });

  it("logs out and redirects to login", async () => {
    const user = userEvent.setup();
    mockLogout.mockResolvedValueOnce(undefined);
    const { queryClient } = renderTopNav();
    queryClient.setQueryData(GROUPS_QUERY_KEY, [{ id: "g1", name: "우리 가족" }]);
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, { id: "1", name: "홍길동" });
    queryClient.setQueryData(["unrelated", "query"], { value: true });

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/login");
      expect(mockRefresh).toHaveBeenCalled();
    });

    expect(queryClient.getQueryData(GROUPS_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(CURRENT_USER_QUERY_KEY)).toBeUndefined();
    expect(queryClient.getQueryData(["unrelated", "query"])).toBeUndefined();
  });

  it("shows a logout error when the request fails", async () => {
    const user = userEvent.setup();
    mockLogout.mockRejectedValueOnce(new Error("로그아웃에 실패했습니다."));
    renderTopNav();

    await user.click(screen.getByRole("button", { name: "사용자 메뉴" }));
    await user.click(screen.getByRole("button", { name: "로그아웃" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("로그아웃에 실패했습니다.");
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
