import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InvitationContent from "../invitation-content";
import { ApiError } from "@/lib/api/errors";

// ── mocks ─────────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => mockSearchParams,
}));

let mockSearchParams = new URLSearchParams("token=valid-token-123");

const mockCurrentUser = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  birthday: null,
  profileImageKey: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

let mockCurrentUserResult: {
  data: typeof mockCurrentUser | undefined;
  isLoading: boolean;
} = { data: mockCurrentUser, isLoading: false };

jest.mock("@/hooks/use-current-user", () => ({
  useCurrentUserQuery: () => mockCurrentUserResult,
}));

const mockInvitation = {
  id: "inv-1",
  groupId: "g1",
  groupName: "우리 가족",
  invitedEmail: "alice@example.com",
  expiresAt: "2026-12-31T23:59:59.000Z",
  createdAt: "2026-08-01T00:00:00.000Z",
};

const mockAccept = jest.fn();
let mockIsAccepting = false;
let mockAcceptError: Error | null = null;

let mockValidateResult: {
  data: typeof mockInvitation | undefined;
  isLoading: boolean;
  error: Error | null;
} = { data: mockInvitation, isLoading: false, error: null };

jest.mock("@/hooks/use-groups", () => ({
  useValidateInvitationQuery: () => mockValidateResult,
  useAcceptInvitationMutation: () => ({
    mutate: mockAccept,
    isPending: mockIsAccepting,
    error: mockAcceptError,
  }),
}));

// ── helpers ───────────────────────────────────────────────────────────────────

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe("InvitationContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams("token=valid-token-123");
    mockCurrentUserResult = { data: mockCurrentUser, isLoading: false };
    mockValidateResult = { data: mockInvitation, isLoading: false, error: null };
    mockIsAccepting = false;
    mockAcceptError = null;
  });

  describe("missing token", () => {
    it("shows an invalid-link message when token is absent", () => {
      mockSearchParams = new URLSearchParams();
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("초대 링크가 올바르지 않아요")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("shows loading spinner while invitation is loading", () => {
      mockValidateResult = { data: undefined, isLoading: true, error: null };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("shows loading spinner while user session is loading", () => {
      mockCurrentUserResult = { data: undefined, isLoading: true };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  describe("unauthenticated user with valid invitation", () => {
    it("redirects to login preserving the invite destination", async () => {
      mockCurrentUserResult = { data: undefined, isLoading: false };
      renderWithQuery(<InvitationContent />);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          "/login?next=%2Finvite%3Ftoken%3Dvalid-token-123"
        );
      });
    });
  });

  describe("valid invitation — authenticated user", () => {
    it("shows group name and invited email", () => {
      renderWithQuery(<InvitationContent />);
      expect(screen.getAllByText("우리 가족").length).toBeGreaterThan(0);
      expect(screen.getByText(/alice@example\.com/)).toBeInTheDocument();
    });

    it("renders the accept button", () => {
      renderWithQuery(<InvitationContent />);
      expect(screen.getByRole("button", { name: "그룹 참가하기" })).toBeEnabled();
    });

    it("calls accept mutation with the token when button is clicked", async () => {
      const user = userEvent.setup();
      renderWithQuery(<InvitationContent />);
      await user.click(screen.getByRole("button", { name: "그룹 참가하기" }));
      expect(mockAccept).toHaveBeenCalledWith(
        "valid-token-123",
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });

    it("redirects to home after successful acceptance", async () => {
      const user = userEvent.setup();
      mockAccept.mockImplementation(
        (_token: string, { onSuccess }: { onSuccess: (group: { id: string }) => void }) => {
          onSuccess({ id: "g1" });
        }
      );
      renderWithQuery(<InvitationContent />);
      await user.click(screen.getByRole("button", { name: "그룹 참가하기" }));
      expect(mockPush).toHaveBeenCalledWith("/home?group=g1");
    });

    it("shows pending label while accepting", () => {
      mockIsAccepting = true;
      renderWithQuery(<InvitationContent />);
      expect(screen.getByRole("button", { name: "참가 중..." })).toBeDisabled();
    });

    it("shows error message when acceptance fails", () => {
      mockAcceptError = new Error("이미 그룹 멤버예요.");
      renderWithQuery(<InvitationContent />);
      expect(screen.getByRole("alert")).toHaveTextContent("이미 그룹 멤버예요.");
    });
  });

  describe("error states", () => {
    it("shows 'not found' state for 404", () => {
      mockValidateResult = {
        data: undefined,
        isLoading: false,
        error: new ApiError("Not found", 404, null),
      };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("초대 링크를 찾을 수 없어요")).toBeInTheDocument();
    });

    it("shows 'expired' state for 410", () => {
      mockValidateResult = {
        data: undefined,
        isLoading: false,
        error: new ApiError("Gone", 410, null),
      };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("초대 링크가 만료되었어요")).toBeInTheDocument();
    });

    it("shows 'already used' state for 409 with a login link", () => {
      mockValidateResult = {
        data: undefined,
        isLoading: false,
        error: new ApiError("Conflict", 409, null),
      };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("이미 사용된 초대 링크예요")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "로그인하기" })).toBeInTheDocument();
    });

    it("shows generic error state for unexpected errors", () => {
      mockValidateResult = {
        data: undefined,
        isLoading: false,
        error: new Error("Network error"),
      };
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("오류가 발생했어요")).toBeInTheDocument();
    });
  });

  describe("branding", () => {
    it("renders the MARU wordmark", () => {
      renderWithQuery(<InvitationContent />);
      expect(screen.getByText("MARU")).toBeInTheDocument();
    });
  });
});
