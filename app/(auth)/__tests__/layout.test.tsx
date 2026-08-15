import AuthLayout from "../layout";

const mockRedirect = jest.fn((_path: string) => {
  throw new Error("NEXT_REDIRECT");
});
const mockHas = jest.fn();

jest.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ has: mockHas }),
}));

jest.mock("next/navigation", () => ({
  redirect: (path: string) => mockRedirect(path),
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders auth pages when there is no session cookie", async () => {
    mockHas.mockReturnValue(false);

    const result = await AuthLayout({
      children: <div>auth content</div>,
    });

    expect(result).toBeTruthy();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects authenticated users away from auth pages", async () => {
    mockHas.mockReturnValue(true);

    await expect(
      AuthLayout({
        children: <div>auth content</div>,
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/home");
  });
});
