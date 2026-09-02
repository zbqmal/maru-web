import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import PhotoPicker, { MAX_PHOTOS, type SelectedPhoto } from "../photo-picker";

const createFile = (name: string, type: string, sizeInBytes: number) => {
  const file = new File([new Uint8Array(sizeInBytes)], name, { type });
  return file;
};

const Harness = ({ maxPhotos }: { maxPhotos?: number }) => {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  return (
    <PhotoPicker
      photos={photos}
      onAdd={(added) => setPhotos((prev) => [...prev, ...added])}
      onRemove={(id) =>
        setPhotos((prev) => {
          const target = prev.find((p) => p.id === id);
          if (target) URL.revokeObjectURL(target.previewUrl);
          return prev.filter((p) => p.id !== id);
        })
      }
      error={error}
      onError={setError}
      maxPhotos={maxPhotos}
    />
  );
};

const HarnessWithUploadState = () => {
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  return (
    <PhotoPicker
      photos={photos}
      onAdd={(added) => setPhotos((prev) => [...prev, ...added])}
      onRemove={(id) => setPhotos((prev) => prev.filter((photo) => photo.id !== id))}
      error={null}
      onError={jest.fn()}
      uploadStates={
        photos[0]
          ? {
              [photos[0].id]: { status: "uploading", progress: 48 },
            }
          : {}
      }
    />
  );
};

describe("PhotoPicker", () => {
  beforeEach(() => {
    window.URL.createObjectURL = jest.fn(() => "blob:mock-url");
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders an accessible add-photo control and no previews initially", () => {
    render(<Harness />);

    expect(screen.getByLabelText("사진 첨부하기")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사진 추가" })).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("shows a local preview after selecting a valid image", async () => {
    render(<Harness />);

    const file = createFile("photo.png", "image/png", 1024);
    const input = screen.getByLabelText("사진 첨부하기");

    await userEvent.upload(input, file);

    expect(screen.getByAltText("첨부한 사진 미리보기 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "사진 1 삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("allows removing a selected photo before upload", async () => {
    render(<Harness />);

    const file = createFile("photo.png", "image/png", 1024);
    const input = screen.getByLabelText("사진 첨부하기");
    await userEvent.upload(input, file);

    expect(screen.getByAltText("첨부한 사진 미리보기 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "사진 1 삭제" }));

    expect(screen.queryByAltText("첨부한 사진 미리보기 1")).not.toBeInTheDocument();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("rejects files with an unsupported type and shows an error", async () => {
    render(<Harness />);

    const file = createFile("document.pdf", "application/pdf", 1024);
    const input = screen.getByLabelText("사진 첨부하기") as HTMLInputElement;
    const userWithoutAcceptFilter = userEvent.setup({ applyAccept: false });

    await userWithoutAcceptFilter.upload(input, file);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "JPG, PNG, WEBP 형식의 사진만 첨부할 수 있어요."
    );
  });

  it("rejects files larger than the size limit and shows an error", async () => {
    render(<Harness />);

    const oversizedFile = createFile("big.png", "image/png", 11 * 1024 * 1024);
    const input = screen.getByLabelText("사진 첨부하기");

    await userEvent.upload(input, oversizedFile);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "사진 용량은 최대 10MB까지 첨부할 수 있어요."
    );
  });

  it(`limits selection to a maximum of ${MAX_PHOTOS} photos and hides the add button when full`, async () => {
    render(<Harness maxPhotos={2} />);

    const input = screen.getByLabelText("사진 첨부하기");
    await userEvent.upload(input, [
      createFile("a.png", "image/png", 1024),
      createFile("b.png", "image/png", 1024),
    ]);

    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "사진 추가" })).not.toBeInTheDocument();
  });

  it("shows an error when selecting more photos than the remaining slots", async () => {
    render(<Harness maxPhotos={1} />);

    const input = screen.getByLabelText("사진 첨부하기");
    await userEvent.upload(input, [
      createFile("a.png", "image/png", 1024),
      createFile("b.png", "image/png", 1024),
    ]);

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("사진은 최대 1장까지 첨부할 수 있어요.");
  });

  it("shows per-photo upload progress when provided", async () => {
    render(<HarnessWithUploadState />);

    await userEvent.upload(
      screen.getByLabelText("사진 첨부하기"),
      createFile("photo.png", "image/png", 1024)
    );

    expect(screen.getByText("업로드 48%")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "사진 1 업로드 진행률" })).toHaveAttribute(
      "aria-valuenow",
      "48"
    );
  });
});
