import {
  getProfile,
  updateProfileBirthday,
  updateProfileName,
  requestProfileImageUpload,
  updateProfileImage,
  removeProfileImage,
} from "@/lib/api/profile";

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
      createMockResponse({ ok: true, status: 200, jsonData: { id: "1" } })
    );

    await getProfile();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("patches /profile/name for display name updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 200, jsonData: { id: "1", name: "새 이름" } })
    );

    await updateProfileName({ name: "새 이름" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/name",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ name: "새 이름" }),
      })
    );
  });

  it("patches /profile/birthday for birthday updates", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        jsonData: { id: "1", birthday: "1995-10-08" },
      })
    );

    await updateProfileBirthday({ birthday: "1995-10-08" });

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/birthday",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ birthday: "1995-10-08" }),
      })
    );
  });

  it("requests an authenticated presigned profile upload", async () => {
    const upload = {
      uploadUrl: "https://s3.example.test/upload",
      storageKey: "profiles/1/photo.png",
    };
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: true, status: 201, jsonData: upload })
    );
    const body = { mimeType: "image/png" as const, sizeBytes: 100 };

    await expect(requestProfileImageUpload(body)).resolves.toEqual(upload);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/image/upload-url",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify(body),
      })
    );
  });

  it("registers the uploaded image key and MIME type", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({
        ok: true,
        status: 200,
        jsonData: { id: "1", profileImageKey: "profiles/1/photo.webp" },
      })
    );
    const body = { storageKey: "profiles/1/photo.webp", mimeType: "image/webp" as const };

    await updateProfileImage(body);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/image",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify(body),
      })
    );
  });

  it("deletes the image and accepts a 204 response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(createMockResponse({ ok: true, status: 204 }));

    await expect(removeProfileImage()).resolves.toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/image",
      expect.objectContaining({ method: "DELETE", credentials: "include", body: undefined })
    );
  });

  it("surfaces image API authorization errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      createMockResponse({ ok: false, status: 403, jsonData: { message: "권한이 없어요." } })
    );

    await expect(
      updateProfileImage({ storageKey: "profiles/1/photo.png", mimeType: "image/png" })
    ).rejects.toThrow("권한이 없어요.");
  });
});
