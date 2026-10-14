import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "@/app/(authenticated)/profile/profile-form";
import { PROFILE_QUERY_KEY } from "../profile-image-control";
import type { Profile } from "@/lib/api/profile";
import { CURRENT_USER_QUERY_KEY } from "@/lib/auth/session";

class UploadRequest {
  static latest: UploadRequest;
  static status = 200;
  static autoFinish = true;
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  status = UploadRequest.status;
  withCredentials = true;
  open = jest.fn();
  setRequestHeader = jest.fn();
  send = jest.fn(() => {
    if (UploadRequest.autoFinish) queueMicrotask(() => this.onload?.());
  });
  constructor() {
    UploadRequest.latest = this;
  }
}

const fixture: Profile = {
  id: "1",
  name: "마루",
  email: "user@example.com",
  birthday: null,
  profileImageKey: "profiles/1/original.png",
  createdAt: "2026-10-14T00:00:00.000Z",
  updatedAt: "2026-10-14T00:00:00.000Z",
};

describe("profile image integration", () => {
  const originalFetch = global.fetch;
  const originalXHR = global.XMLHttpRequest;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const originalApi = process.env.NEXT_PUBLIC_API_URL;
  const originalCdn = process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;
  let serverProfile: Profile;
  let requestCount: number;
  let failingPath: string | null;
  let queryClient: QueryClient;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3001";
    process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = "https://cdn.example.test";
    serverProfile = { ...fixture };
    requestCount = 0;
    failingPath = null;
    UploadRequest.autoFinish = true;
    UploadRequest.status = 200;
    global.XMLHttpRequest = UploadRequest as unknown as typeof XMLHttpRequest;
    URL.createObjectURL = jest.fn().mockReturnValueOnce("blob:first").mockReturnValue("blob:next");
    URL.revokeObjectURL = jest.fn();
    global.fetch = jest.fn(async (url: RequestInfo | URL, options?: RequestInit) => {
      const path = new URL(url.toString()).pathname;
      const body = options?.body ? JSON.parse(options.body as string) : null;
      if (path === failingPath) {
        return {
          ok: false,
          status: 500,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({ message: "이미지 저장에 실패했어요." }),
        } as Response;
      }
      if (path === "/profile/image/upload-url") {
        requestCount++;
        return {
          ok: true,
          status: 201,
          headers: new Headers({ "content-type": "application/json" }),
          json: async () => ({
            uploadUrl: `https://s3.example.test/upload-${requestCount}`,
            storageKey: `profiles/1/new-${requestCount}.png`,
          }),
        } as Response;
      }
      if (path === "/profile/image" && options?.method === "PATCH") {
        serverProfile = { ...serverProfile, profileImageKey: body.storageKey };
      }
      if (path === "/profile/image" && options?.method === "DELETE") {
        serverProfile = { ...serverProfile, profileImageKey: null };
        return { ok: true, status: 204 } as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => serverProfile,
      } as Response;
    });
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(CURRENT_USER_QUERY_KEY, fixture);
    queryClient.setQueryData(["groups"], []);
    queryClient.setQueryData(["groups", "g1", "diary-feed", "2026-10-14"], { members: [] });
  });

  afterEach(() => {
    cleanup();
    queryClient.clear();
    global.fetch = originalFetch;
    global.XMLHttpRequest = originalXHR;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    if (originalApi === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApi;
    if (originalCdn === undefined) delete process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL;
    else process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL = originalCdn;
  });

  const setup = async () => {
    const result = render(
      <QueryClientProvider client={queryClient}>
        <ProfileForm />
      </QueryClientProvider>
    );
    await screen.findByLabelText("프로필 이미지 파일 선택");
    return { ...result, user: userEvent.setup({ applyAccept: false }) };
  };
  const selectImage = async (
    user: ReturnType<typeof userEvent.setup>,
    file = new File(["image"], "new.png", { type: "image/png" })
  ) => {
    await user.upload(screen.getByLabelText("프로필 이미지 파일 선택"), file);
    return file;
  };
  const image = (alt = "프로필 이미지") => screen.getByAltText(alt);

  it("opens the file picker from the button and ignores an empty selection", async () => {
    const { user } = await setup();
    const input = screen.getByLabelText("프로필 이미지 파일 선택");
    const click = jest.spyOn(input, "click");
    await user.click(screen.getByRole("button", { name: "이미지 변경" }));
    expect(click).toHaveBeenCalled();
    fireEvent.change(input, { target: { files: [] } });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "이미지 저장" })).not.toBeInTheDocument();
  });

  it("accepts the exact size limit and retains a valid selection when a later file is rejected", async () => {
    const { user } = await setup();
    await selectImage(
      user,
      new File([new Uint8Array(10 * 1024 * 1024)], "limit.webp", { type: "image/webp" })
    );
    expect(screen.getByRole("button", { name: "이미지 저장" })).toBeEnabled();
    await selectImage(user, new File(["invalid"], "invalid.gif", { type: "image/gif" }));
    expect(image("선택한 프로필 이미지 미리보기")).toHaveAttribute("src", "blob:first");
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("preserves unsaved name edits when the image is saved independently", async () => {
    const { user } = await setup();
    const name = screen.getByLabelText("이름");
    await user.clear(name);
    await user.type(name, "수정 중인 이름");
    await selectImage(user);
    await user.click(screen.getByRole("button", { name: "이미지 저장" }));
    await screen.findByText("프로필 이미지가 저장되었어요.");
    expect(name).toHaveValue("수정 중인 이름");
    expect(serverProfile.name).toBe("마루");
  });

  it("renders the saved image, previews replacements, cancels and releases object URLs", async () => {
    const { user, unmount } = await setup();
    expect(image()).toHaveAttribute("src", "https://cdn.example.test/profiles/1/original.png");
    await selectImage(user);
    expect(image("선택한 프로필 이미지 미리보기")).toHaveAttribute("src", "blob:first");
    expect(requestCount).toBe(0);
    await selectImage(user);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    await user.click(screen.getByRole("button", { name: "선택 취소" }));
    expect(image()).toHaveAttribute("src", "https://cdn.example.test/profiles/1/original.png");
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:next");
    await selectImage(user);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenLastCalledWith("blob:next");
  });

  it.each([
    ["image/gif", 1, "JPG, PNG, WEBP 형식"],
    ["image/png", 0, "0바이트보다 크고"],
    ["image/png", 10 * 1024 * 1024 + 1, "최대 10MB"],
  ])(
    "rejects invalid type/size (%s, %s) without requesting an upload",
    async (type, size, message) => {
      const { user } = await setup();
      await selectImage(user, new File([new Uint8Array(size)], "invalid", { type }));
      expect(screen.getByRole("alert")).toHaveTextContent(message);
      expect(screen.queryByRole("button", { name: "이미지 저장" })).not.toBeInTheDocument();
      expect(requestCount).toBe(0);
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    }
  );

  it.each(["image/jpeg", "image/png", "image/webp"])(
    "uploads %s with correct metadata, then updates shared caches",
    async (type) => {
      const { user } = await setup();
      const file = await selectImage(user, new File(["image"], "photo", { type }));
      await user.click(screen.getByRole("button", { name: "이미지 저장" }));
      expect(await screen.findByText("프로필 이미지가 저장되었어요.")).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/profile/image/upload-url",
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ mimeType: type, sizeBytes: file.size }),
        })
      );
      expect(UploadRequest.latest.open).toHaveBeenCalledWith(
        "PUT",
        "https://s3.example.test/upload-1"
      );
      expect(UploadRequest.latest.withCredentials).toBe(false);
      expect(UploadRequest.latest.setRequestHeader).toHaveBeenCalledWith("Content-Type", type);
      expect(UploadRequest.latest.send).toHaveBeenCalledWith(file);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3001/profile/image",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ storageKey: "profiles/1/new-1.png", mimeType: type }),
        })
      );
      expect(queryClient.getQueryData<Profile>(PROFILE_QUERY_KEY)?.profileImageKey).toBe(
        "profiles/1/new-1.png"
      );
      expect(queryClient.getQueryData<Profile>(CURRENT_USER_QUERY_KEY)?.profileImageKey).toBe(
        "profiles/1/new-1.png"
      );
      expect(queryClient.getQueryState(["groups"])?.isInvalidated).toBe(true);
      expect(
        queryClient.getQueryState(["groups", "g1", "diary-feed", "2026-10-14"])?.isInvalidated
      ).toBe(true);
      expect(image()).toHaveAttribute("src", "https://cdn.example.test/profiles/1/new-1.png");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first");
    }
  );

  it("reports progress and blocks conflicting image/profile changes while uploading", async () => {
    UploadRequest.autoFinish = false;
    const { user } = await setup();
    await selectImage(user);
    await user.click(screen.getByRole("button", { name: "이미지 저장" }));
    await waitFor(() => expect(UploadRequest.latest.send).toHaveBeenCalled());
    act(() =>
      UploadRequest.latest.upload.onprogress?.({
        lengthComputable: true,
        loaded: 2,
        total: 5,
      } as ProgressEvent)
    );
    await waitFor(() =>
      expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "40")
    );
    expect(screen.getByRole("button", { name: "이미지 변경" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "선택 취소" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "저장하기" })).toBeDisabled();
    act(() => UploadRequest.latest.onload?.());
    await screen.findByText("프로필 이미지가 저장되었어요.");
    expect(screen.getByRole("button", { name: "저장하기" })).toBeEnabled();
  });

  it.each(["presign", "binary", "registration"])(
    "retains the preview after %s failure and supports retry",
    async (stage) => {
      if (stage === "binary") UploadRequest.status = 403;
      else failingPath = stage === "presign" ? "/profile/image/upload-url" : "/profile/image";
      const { user } = await setup();
      await selectImage(user);
      await user.click(screen.getByRole("button", { name: "이미지 저장" }));
      expect(await screen.findByRole("alert")).toBeInTheDocument();
      expect(image("선택한 프로필 이미지 미리보기")).toHaveAttribute("src", "blob:first");
      expect(queryClient.getQueryData<Profile>(CURRENT_USER_QUERY_KEY)?.profileImageKey).toBe(
        fixture.profileImageKey
      );
      if (stage === "binary") {
        expect(global.fetch).not.toHaveBeenCalledWith(
          "http://localhost:3001/profile/image",
          expect.objectContaining({ method: "PATCH" })
        );
      }
      failingPath = null;
      UploadRequest.status = 200;
      await user.click(screen.getByRole("button", { name: "이미지 저장" }));
      await screen.findByText("프로필 이미지가 저장되었어요.");
      expect(requestCount).toBe(stage === "presign" ? 1 : 2);
    }
  );

  it("requires explicit removal confirmation, allows cancellation and restores initials", async () => {
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "이미지 삭제" }));
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(serverProfile.profileImageKey).toBe(fixture.profileImageKey);
    await user.click(screen.getByRole("button", { name: "이미지 삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제 확인" }));
    await screen.findByText("프로필 이미지가 삭제되었어요.");
    expect(screen.queryByAltText("프로필 이미지")).not.toBeInTheDocument();
    expect(queryClient.getQueryData<Profile>(CURRENT_USER_QUERY_KEY)?.profileImageKey).toBeNull();
    expect(screen.queryByRole("button", { name: "이미지 삭제" })).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/profile/image",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("preserves the image after removal failure and permits retry", async () => {
    failingPath = "/profile/image";
    const { user } = await setup();
    await user.click(screen.getByRole("button", { name: "이미지 삭제" }));
    await user.click(screen.getByRole("button", { name: "삭제 확인" }));
    await screen.findByRole("alert");
    expect(image()).toBeInTheDocument();
    failingPath = null;
    await user.click(screen.getByRole("button", { name: "삭제 확인" }));
    await screen.findByText("프로필 이미지가 삭제되었어요.");
  });

  it("falls back for a broken saved image and still displays a new local preview", async () => {
    const { user } = await setup();
    fireEvent.error(image());
    expect(screen.queryByAltText("프로필 이미지")).not.toBeInTheDocument();
    await selectImage(user);
    expect(image("선택한 프로필 이미지 미리보기")).toBeInTheDocument();
  });
});
