import { getImageDimensions } from "@/lib/utils/media.utils";

describe("getImageDimensions", () => {
  const originalImage = global.Image;
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;

  afterEach(() => {
    global.Image = originalImage;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("resolves the natural width/height of the image file", async () => {
    window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = jest.fn();

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      naturalWidth = 1200;
      naturalHeight = 900;
      set src(_value: string) {
        setTimeout(() => this.onload?.(), 0);
      }
    }
    // @ts-expect-error -- simplified stand-in for the browser Image constructor
    global.Image = MockImage;

    const file = new File([new Uint8Array(4)], "photo.png", { type: "image/png" });
    const dimensions = await getImageDimensions(file);

    expect(dimensions).toEqual({ width: 1200, height: 900 });
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("rejects when the image fails to load", async () => {
    window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = jest.fn();

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    // @ts-expect-error -- simplified stand-in for the browser Image constructor
    global.Image = MockImage;

    const file = new File([new Uint8Array(4)], "corrupt.png", { type: "image/png" });

    await expect(getImageDimensions(file)).rejects.toThrow("사진 크기를 확인하지 못했어요.");
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });
});
