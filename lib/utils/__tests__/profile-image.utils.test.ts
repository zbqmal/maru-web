import { getProfileImageUrl } from "@/lib/utils/profile-image.utils";

describe("getProfileImageUrl", () => {
  const originalBaseUrl = process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;

  afterEach(() => {
    if (originalBaseUrl === undefined) delete process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;
    else process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = originalBaseUrl;
  });

  it("builds a CDN URL preserving the storage key and escaping its segments", () => {
    process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = "https://cdn.example.test/media/";
    expect(getProfileImageUrl("profiles/user/photo image.png")).toBe(
      "https://cdn.example.test/media/profiles/user/photo%20image.png"
    );
  });

  it("uses initials when the storage key or readable base URL is unavailable", () => {
    delete process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;
    expect(getProfileImageUrl("profiles/user/photo.png")).toBeNull();
    process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = "https://cdn.example.test";
    expect(getProfileImageUrl(null)).toBeNull();
    expect(getProfileImageUrl("")).toBeNull();
    // The generated OpenAPI currently describes this string field as an object.
    expect(getProfileImageUrl({} as unknown as string)).toBeNull();
  });

  it.each(["javascript:alert(1)", "data:image/png;base64,AAA", "invalid", "******example.test"])(
    "rejects an invalid or unsafe base URL: %s",
    (base) => {
      process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = base;
      expect(getProfileImageUrl("profiles/user/photo.png")).toBeNull();
    }
  );

  it.each([
    "../photo.png",
    "profiles/../photo.png",
    "/photo.png",
    "profiles//photo.png",
    "./photo.png",
  ])("rejects path traversal or malformed keys: %s", (key) => {
    process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = "https://cdn.example.test";
    expect(getProfileImageUrl(key)).toBeNull();
  });

  it("does not retain base URL query parameters or fragments", () => {
    process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL =
      "https://cdn.example.test/media?unused=1#fragment";
    expect(getProfileImageUrl("profiles/user/photo.png")).toBe(
      "https://cdn.example.test/media/profiles/user/photo.png"
    );
  });
});
