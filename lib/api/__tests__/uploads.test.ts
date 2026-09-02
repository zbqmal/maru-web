import { uploadFileToPresignedUrl } from "@/lib/api/uploads";

type MockUploadProgressHandler = ((event: ProgressEvent) => void) | null;

class MockXMLHttpRequest {
  static latest: MockXMLHttpRequest | null = null;

  upload: { onprogress: MockUploadProgressHandler } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  status = 200;
  withCredentials = true;
  method = "";
  url = "";
  sentBody: Document | XMLHttpRequestBodyInit | null = null;
  headers: Record<string, string> = {};

  constructor() {
    MockXMLHttpRequest.latest = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  send(body?: Document | XMLHttpRequestBodyInit | null) {
    this.sentBody = body ?? null;
  }
}

describe("uploadFileToPresignedUrl", () => {
  const originalXMLHttpRequest = global.XMLHttpRequest;

  beforeEach(() => {
    MockXMLHttpRequest.latest = null;
    global.XMLHttpRequest = MockXMLHttpRequest as unknown as typeof XMLHttpRequest;
  });

  afterEach(() => {
    global.XMLHttpRequest = originalXMLHttpRequest;
  });

  it("uploads the file directly to the presigned URL without credentials and reports progress", async () => {
    const file = new File([new Uint8Array(100)], "photo.png", { type: "image/png" });
    const onProgress = jest.fn();

    const promise = uploadFileToPresignedUrl("https://s3.example.test/upload", file, onProgress);
    const request = MockXMLHttpRequest.latest!;

    request.upload.onprogress?.({
      lengthComputable: true,
      loaded: 50,
      total: 100,
    } as ProgressEvent);
    request.onload?.();

    await expect(promise).resolves.toBeUndefined();
    expect(request.method).toBe("PUT");
    expect(request.url).toBe("https://s3.example.test/upload");
    expect(request.withCredentials).toBe(false);
    expect(request.headers).toEqual({ "Content-Type": "image/png" });
    expect(request.sentBody).toBe(file);
    expect(onProgress).toHaveBeenCalledWith({ percent: 50, loaded: 50, total: 100 });
    expect(onProgress).toHaveBeenLastCalledWith({ percent: 100, loaded: 100, total: 100 });
  });

  it("rejects when S3 returns a non-success status", async () => {
    const file = new File([new Uint8Array(10)], "photo.png", { type: "image/png" });

    const promise = uploadFileToPresignedUrl("https://s3.example.test/upload", file);
    const request = MockXMLHttpRequest.latest!;
    request.status = 403;
    request.onload?.();

    await expect(promise).rejects.toThrow("사진 업로드에 실패했어요.");
  });
});
