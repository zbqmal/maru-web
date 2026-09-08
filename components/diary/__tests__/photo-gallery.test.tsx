import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoGallery from "../photo-gallery";
import type { DiaryPhoto } from "@/lib/api/diary";

const makePhoto = (overrides: Partial<DiaryPhoto> = {}): DiaryPhoto => ({
  id: "p1",
  diaryEntryId: "e1",
  uploadedByUserId: "u1",
  storageKey: "diary-entries/e1/photos/photo.png",
  mimeType: "image/png",
  width: 800,
  height: 600,
  sizeBytes: 1024,
  displayOrder: 0,
  createdAt: "2026-08-26T00:00:00.000Z",
  ...overrides,
});

describe("PhotoGallery", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_MEDIA_BASE_URL = "https://media.example.test";
  });

  it("renders nothing when there are no photos", () => {
    const { container } = render(<PhotoGallery photos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a thumbnail per photo ordered by displayOrder", () => {
    const photos = [
      makePhoto({ id: "p2", displayOrder: 1, storageKey: "photo-2.png" }),
      makePhoto({ id: "p1", displayOrder: 0, storageKey: "photo-1.png" }),
    ];
    render(<PhotoGallery photos={photos} />);

    const thumbnails = screen.getAllByAltText(/다이어리 사진/);
    expect(thumbnails).toHaveLength(2);
    expect(thumbnails[0]).toHaveAttribute("src", "https://media.example.test/photo-1.png");
    expect(thumbnails[1]).toHaveAttribute("src", "https://media.example.test/photo-2.png");
  });

  it("shows an error placeholder when the image fails to load", () => {
    render(<PhotoGallery photos={[makePhoto()]} />);

    const image = screen.getByAltText("다이어리 사진 1");
    fireEvent.error(image);

    expect(screen.getByText("이미지를 불러올 수 없어요")).toBeInTheDocument();
    expect(screen.queryByAltText("다이어리 사진 1")).not.toBeInTheDocument();
  });

  it("opens a lightbox with next/prev navigation when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const photos = [
      makePhoto({ id: "p1", displayOrder: 0, storageKey: "photo-1.png" }),
      makePhoto({ id: "p2", displayOrder: 1, storageKey: "photo-2.png" }),
    ];
    render(<PhotoGallery photos={photos} />);

    await user.click(screen.getByRole("button", { name: "사진 1 크게 보기" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByAltText("다이어리 사진 1")).toHaveAttribute(
      "src",
      "https://media.example.test/photo-1.png"
    );

    await user.click(screen.getByRole("button", { name: "다음 사진" }));
    expect(within(dialog).getByAltText("다이어리 사진 2")).toHaveAttribute(
      "src",
      "https://media.example.test/photo-2.png"
    );

    await user.click(screen.getByRole("button", { name: "이전 사진" }));
    expect(within(dialog).getByAltText("다이어리 사진 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "닫기" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not show prev/next controls for a single photo", async () => {
    const user = userEvent.setup();
    render(<PhotoGallery photos={[makePhoto()]} />);

    await user.click(screen.getByRole("button", { name: "사진 1 크게 보기" }));

    expect(screen.queryByRole("button", { name: "다음 사진" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "이전 사진" })).not.toBeInTheDocument();
  });

  it("shows a remove button only when canRemove is true and calls onRemove", async () => {
    const user = userEvent.setup();
    const onRemove = jest.fn();
    const { rerender } = render(<PhotoGallery photos={[makePhoto()]} canRemove={false} />);

    expect(screen.queryByRole("button", { name: "사진 1 삭제" })).not.toBeInTheDocument();

    rerender(<PhotoGallery photos={[makePhoto()]} canRemove onRemove={onRemove} />);
    await user.click(screen.getByRole("button", { name: "사진 1 삭제" }));

    expect(onRemove).toHaveBeenCalledWith("p1");
  });

  it("disables the remove button and shows a busy state while removing", () => {
    render(
      <PhotoGallery
        photos={[makePhoto({ id: "p1" })]}
        canRemove
        onRemove={jest.fn()}
        removingPhotoId="p1"
      />
    );

    expect(screen.getByRole("button", { name: "사진 1 삭제" })).toBeDisabled();
  });
});
