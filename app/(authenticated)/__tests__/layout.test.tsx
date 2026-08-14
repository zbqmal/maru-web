import AuthenticatedLayout from "../layout";

const mockRedirect = jest.fn(() => {
  throw new Error("NEXT_REDIRECT");
});
const mockHas = jest.fn();

jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ has: mockHas }),
}));

jest.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

jest.mock("@/components/auth/authenticated-app-shell", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AuthenticatedLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects unauthenticated users to login", async () => {
    mockHas.mockReturnValue(false);

    await expect(
      AuthenticatedLayout({
        children: <div>private content</div>,
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders protected pages when the session cookie exists", async () => {
    mockHas.mockReturnValue(true);

    const result = await AuthenticatedLayout({
      children: <div>private content</div>,
    });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
