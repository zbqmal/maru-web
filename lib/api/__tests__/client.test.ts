import { apiRequest } from "@/lib/api/client";

describe("apiRequest", () => {
  const originalFetch = global.fetch;
  const createMockResponse = ({
    ok,
    status,
    contentType,
    jsonData,
    textData,
  }: {
    ok: boolean;
    status: number;
    contentType: string;
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

  it("sends credentialed requests and returns JSON data", async () => {
    const mockResponse = createMockResponse({
      ok: true,
      status: 200,
      contentType: "application/json",
      jsonData: { ok: true },
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await apiRequest<{ ok: boolean }>("/health");

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/health", {
      credentials: "include",
      headers: expect.any(Headers),
    });
  });

  it("serializes object body to JSON", async () => {
    const mockResponse = createMockResponse({
      ok: true,
      status: 201,
      contentType: "application/json",
      jsonData: { id: 1 },
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await apiRequest<{ id: number }>("/entries", {
      method: "POST",
      body: { content: "hello" },
    });

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/entries", {
      method: "POST",
      body: JSON.stringify({ content: "hello" }),
      credentials: "include",
      headers: expect.any(Headers),
    });
  });

  it("throws ApiError with message from API response", async () => {
    const mockResponse = createMockResponse({
      ok: false,
      status: 400,
      contentType: "application/json",
      jsonData: { message: ["A", "B"] },
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(apiRequest("/bad-request")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "A, B",
    });
  });
});
