import { getDiaryContext } from "@/lib/api/diary";

describe("diary api", () => {
  const originalFetch = global.fetch;

  const createMockResponse = ({ ok, status, jsonData }: { ok: boolean; status: number; jsonData?: unknown }) =>
    ({
      ok,
      status,
      headers: {
        get: (header: string) => (header === "content-type" ? "application/json" : null),
      },
      json: async () => jsonData,
      text: async () => "",
    }) as unknown as Response;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls GET /groups/:id/diary/context with date", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { questions: [], entry: null } })
    );

    await getDiaryContext("g1", "2026-08-25");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1/diary/context?date=2026-08-25",
      expect.objectContaining({ credentials: "include" })
    );
  });
});
