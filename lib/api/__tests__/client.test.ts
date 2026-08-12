import { apiRequest } from "@/lib/api/client";

describe("apiRequest", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("sends credentialed requests and returns JSON data", async () => {
    const mockResponse = new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "content-type": "application/json",
      },
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
    const mockResponse = new Response(JSON.stringify({ id: 1 }), {
      status: 201,
      headers: {
        "content-type": "application/json",
      },
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
    const mockResponse = new Response(JSON.stringify({ message: ["A", "B"] }), {
      status: 400,
      headers: {
        "content-type": "application/json",
      },
    });

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    await expect(apiRequest("/bad-request")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "A, B",
    });
  });
});
