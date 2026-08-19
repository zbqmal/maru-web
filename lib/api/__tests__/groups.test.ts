import { listGroups, createGroup, getGroup, listGroupMembers, deleteGroup } from "@/lib/api/groups";

describe("groups api", () => {
  const originalFetch = global.fetch;

  const createMockResponse = ({
    ok,
    status,
    jsonData,
  }: {
    ok: boolean;
    status: number;
    jsonData?: unknown;
  }) =>
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

  it("listGroups calls GET /groups", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: [] })
    );

    await listGroups();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("createGroup calls POST /groups with name", async () => {
    const group = { id: "g1", name: "우리 가족", createdAt: "", updatedAt: "", memberships: [] };
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 201, jsonData: group })
    );

    const result = await createGroup({ name: "우리 가족" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ name: "우리 가족" }),
      })
    );
    expect(result).toEqual(group);
  });

  it("getGroup calls GET /groups/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { id: "g1" } })
    );

    await getGroup("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("listGroupMembers calls GET /groups/:id/members", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: [] })
    );

    await listGroupMembers("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1/members",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("deleteGroup calls DELETE /groups/:id", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(createMockResponse({ ok: true, status: 204 }));

    await deleteGroup("g1");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/groups/g1",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      })
    );
  });
});
