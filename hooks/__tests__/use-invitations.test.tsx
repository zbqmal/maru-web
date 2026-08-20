import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useInviteMemberMutation } from "@/hooks/use-invitations";
import { createInvitation } from "@/lib/api/invitations";
import type { Invitation } from "@/lib/api/invitations";

jest.mock("@/lib/api/invitations");

const mockedCreateInvitation = createInvitation as jest.MockedFunction<typeof createInvitation>;

const GROUP_ID = "group-1";

const makeInvitation = (): Invitation => ({
  id: "inv-1",
  groupId: GROUP_ID,
  invitedEmail: "alice@example.com",
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  acceptedAt: null,
  createdAt: new Date().toISOString(),
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

describe("useInviteMemberMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls createInvitation with the correct groupId and email", async () => {
    mockedCreateInvitation.mockResolvedValue(makeInvitation());

    const { result } = renderHook(() => useInviteMemberMutation(GROUP_ID), { wrapper });

    result.current.mutate({ email: "alice@example.com" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedCreateInvitation).toHaveBeenCalledWith(GROUP_ID, {
      email: "alice@example.com",
    });
  });

  it("exposes error when the API call fails", async () => {
    mockedCreateInvitation.mockRejectedValue(new Error("이미 초대된 이메일이에요."));

    const { result } = renderHook(() => useInviteMemberMutation(GROUP_ID), { wrapper });

    result.current.mutate({ email: "taken@example.com" });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("이미 초대된 이메일이에요."));
  });
});
