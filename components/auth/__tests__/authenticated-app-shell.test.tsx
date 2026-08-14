import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthenticatedAppShell from "../authenticated-app-shell";

const mockReplace = jest.fn();
const mockUseCurrentUserQuery = jest.fn();
const mockRefetch = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/profile",
}));

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => mockUseCurrentUserQuery(),
}));

jest.mock("@/components/layout/app-shell", () => ({
  __esModule: true,
  default: ({
    currentUser,
    children,
  }: {
    currentUser: { name: string };
    children: React.ReactNode;
  }) => (
    <div>
      <span>{currentUser.name}</span>
      {children}
    </div>
  ),
}));

describe("AuthenticatedAppShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRefetch.mockResolvedValue(undefined);
  });

  it("shows a loading state while checking the session", () => {
    mockUseCurrentUserQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    });

    render(
      <AuthenticatedAppShell>
        <div>content</div>
      </AuthenticatedAppShell>
    );

    expect(screen.getByRole("status", { name: "세션을 확인하는 중..." })).toBeInTheDocument();
  });

  it("redirects to login when no authenticated user is available", async () => {
    mockUseCurrentUserQuery.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    render(
      <AuthenticatedAppShell>
        <div>content</div>
      </AuthenticatedAppShell>
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?next=%2Fprofile");
    });
  });

  it("renders the app shell when the session is valid", () => {
    mockUseCurrentUserQuery.mockReturnValue({
      data: { id: "1", email: "user@example.com", name: "홍길동" },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    });

    render(
      <AuthenticatedAppShell>
        <div>content</div>
      </AuthenticatedAppShell>
    );

    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("shows a retryable error state when session lookup fails", async () => {
    const user = userEvent.setup();
    mockUseCurrentUserQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    render(
      <AuthenticatedAppShell>
        <div>content</div>
      </AuthenticatedAppShell>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("세션을 확인할 수 없어요");
    await user.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(mockRefetch).toHaveBeenCalled();
  });
});
