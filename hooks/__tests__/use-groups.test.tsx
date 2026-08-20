import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createInvitation, listGroups, type Invitation } from "@/lib/api/groups";
import { getCurrentUser } from "@/lib/api/auth";
import { useActiveGroupQuery, useGroupsQuery, useInviteMemberMutation } from "../use-groups";

jest.mock("@/lib/api/groups", () => ({
  listGroups: jest.fn(),
  createGroup: jest.fn(),
  createInvitation: jest.fn(),
}));

jest.mock("@/lib/api/auth", () => ({
  getCurrentUser: jest.fn(),
}));

const mockListGroups = listGroups as jest.MockedFunction<typeof listGroups>;
const mockCreateInvitation = createInvitation as jest.MockedFunction<typeof createInvitation>;
const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;

const GROUP_ID = "group-1";

const makeInvitation = (): Invitation => ({
  id: "inv-1",
  groupId: GROUP_ID,
  invitedEmail: "alice@example.com",
  expiresAt: "2026-08-21T00:00:00.000Z",
  acceptedAt: null,
  createdAt: "2026-08-20T00:00:00.000Z",
});

jest.mock("@/lib/store/active-group", () => ({
  useActiveGroupStore: (selector: (state: { activeGroupId: string | null }) => unknown) =>
    selector({ activeGroupId: "g1" }),
}));

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

  it("derives the active group from the selected group id", async () => {
    mockGetCurrentUser.mockResolvedValueOnce({
      id: "u1",
      email: "user@example.com",
      name: "홍길동",
      birthday: null,
      profileImageKey: null,
      createdAt: "2026-08-14T00:00:00.000Z",
      updatedAt: "2026-08-14T00:00:00.000Z",
    });
    mockListGroups.mockResolvedValueOnce([
      {
        id: "g1",
        name: "우리 가족",
        createdAt: "2026-08-14T00:00:00.000Z",
        updatedAt: "2026-08-14T00:00:00.000Z",
        memberships: [],
      },
    ]);

    const { result } = renderHook(() => useActiveGroupQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockListGroups).toHaveBeenCalledTimes(1));

    expect(result.current.activeGroup?.name).toBe("우리 가족");
    expect(result.current.activeGroupId).toBe("g1");
  });

  it("returns no active group when the selected id is not in the group list", async () => {
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

    const { result } = renderHook(() => useActiveGroupQuery(), { wrapper: createWrapper() });

    await waitFor(() => expect(mockListGroups).toHaveBeenCalledTimes(1));

    expect(result.current.activeGroup).toBeNull();
  });

  describe("useInviteMemberMutation", () => {
    it("calls createInvitation with the group id and email", async () => {
      mockCreateInvitation.mockResolvedValueOnce(makeInvitation());

      const { result } = renderHook(() => useInviteMemberMutation(GROUP_ID), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: "alice@example.com" });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockCreateInvitation).toHaveBeenCalledWith(GROUP_ID, {
        email: "alice@example.com",
      });
    });

    it("exposes the API error", async () => {
      const error = new Error("이미 초대된 이메일이에요.");
      mockCreateInvitation.mockRejectedValueOnce(error);

      const { result } = renderHook(() => useInviteMemberMutation(GROUP_ID), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ email: "taken@example.com" });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });
  });
});
