import { getProfile, updateProfileBirthday, updateProfileName } from "@/lib/api/profile";

describe("profile api", () => {
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

  it("uses the /profile endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { id: "1" } }),
    );

    await getProfile();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("patches /profile/name for display name updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { id: "1", name: "새 이름" } }),
    );

    await updateProfileName({ name: "새 이름" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/name",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ name: "새 이름" }),
      }),
    );
  });

  it("patches /profile/birthday for birthday updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        jsonData: { id: "1", birthday: "1995-10-08" },
      }),
    );

    await updateProfileBirthday({ birthday: "1995-10-08" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/birthday",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ birthday: "1995-10-08" }),
      }),
    );
  });
});
