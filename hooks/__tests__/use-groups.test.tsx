import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listGroups } from "@/lib/api/groups";
import { getCurrentUser } from "@/lib/api/auth";
import { useGroupsQuery } from "../use-groups";

jest.mock("@/lib/api/groups", () => ({
  listGroups: jest.fn(),
  createGroup: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  getCurrentUser: jest.fn(),
}));

const mockListGroups = listGroups as jest.MockedFunction<typeof listGroups>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return QueryWrapper;
};

describe("useGroupsQuery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("waits for an authenticated user before loading groups", async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useGroupsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalledTimes(1));

    expect(mockListGroups).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("loads groups after the current user is authenticated", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "u1",
      email: "user@example.com",
      name: "홍길동",
      birthday: null,
      profileImageKey: null,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    });
    mockListGroups.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useGroupsQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockListGroups).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual([]);
  });
});
