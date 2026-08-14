import { ApiError } from "@/lib/api/errors";
import { getCurrentUser, login, logout, register } from "@/lib/api/auth";

describe("auth api", () => {
  const originalFetch = global.fetch;

  const createMockResponse = ({
    ok,
    status,
    contentType = "application/json",
    jsonData,
    textData,
  }: {
    ok: boolean;
    status: number;
    contentType?: string;
    jsonData?: unknown;
    textData?: string;
  }) =>
    ({
      ok,
      status,
      headers: {
        get: (header: string) => (header === "content-type" ? contentType : null),
      },
      json: async () => jsonData,
      text: async () => textData ?? "",
    }) as unknown as Response;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("uses the login endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { id: "1" } })
    );

    await login({ email: "user@example.com", password: "password" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/login",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("uses the register endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 201, jsonData: { id: "1" } })
    );

    await register({ name: "홍길동", email: "user@example.com", password: "Str0ngP@ss" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/register",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });

  it("returns the authenticated user from /me", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        jsonData: { id: "1", email: "user@example.com", name: "홍길동" },
      })
    );

    await expect(getCurrentUser()).resolves.toMatchObject({
      id: "1",
      email: "user@example.com",
      name: "홍길동",
    });
  });

  it("returns null when the session is unauthorized", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 401,
        jsonData: { message: "Unauthorized" },
      })
    );

    await expect(getCurrentUser()).resolves.toBeNull();
  });

  it("rethrows non-auth current-user failures", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: false,
        status: 500,
        jsonData: { message: "boom" },
      })
    );

    await expect(getCurrentUser()).rejects.toBeInstanceOf(ApiError);
  });

  it("calls the logout endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 204, contentType: "text/plain" })
    );

    await logout();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/logout",
      expect.objectContaining({ method: "POST", credentials: "include" })
    );
  });
});
