export const getProfileImageUrl = (storageKey: string | null): string | null => {
  const baseUrl = process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;
  if (!baseUrl || typeof storageKey !== "string" || !storageKey) return null;

  const segments = storageKey.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) return null;

  try {
    const base = new URL(baseUrl);
    if (!["https:", "http:"].includes(base.protocol) || base.username || base.password) return null;
    base.search = "";
    base.hash = "";
    base.pathname = `${base.pathname.replace(/\/$/, "")}/${segments.map(encodeURIComponent).join("/")}`;
    return base.toString();
  } catch {
    return null;
  }
};
