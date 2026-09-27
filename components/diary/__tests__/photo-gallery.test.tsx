import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhotoGallery from "../photo-gallery";
import type { DiaryPhoto } from "@/lib/api/diary";

const makePhoto = (overrides: Partial<DiaryPhoto> = {}): DiaryPhoto => ({
  id: "p1",
  diaryEntryId: "e1",
  uploadedByUserId: "u1",
  storageKey: "diary-entries/e1/photos/photo.png",
  url: "https://media.example.test/diary-entries/e1/photos/photo.png",
  mimeType: "image/png",
  width: 800,
  height: 600,
  sizeBytes: 1024,
  displayOrder: 0,
  createdAt: "2026-08-26T00:00:00.000Z",
  ...overrides,
});

describe("PhotoGallery", () => {
  it("renders nothing when there are no photos", () => {
    const { container } = render(<PhotoGallery photos={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a thumbnail per photo ordered by displayOrder", () => {
    const photos = [
      makePhoto({ id: "p2", displayOrder: 1, url: "https://media.example.test/photo-2.png" }),
      makePhoto({ id: "p1", displayOrder: 0, url: "https://media.example.test/photo-1.png" }),
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

  it("recovers from an error placeholder once a refreshed photo.url is provided", () => {
    const { rerender } = render(<PhotoGallery photos={[makePhoto()]} />);

    fireEvent.error(screen.getByAltText("다이어리 사진 1"));
    expect(screen.getByText("이미지를 불러올 수 없어요")).toBeInTheDocument();

    rerender(
      <PhotoGallery photos={[makePhoto({ url: "https://media.example.test/refreshed.png" })]} />
    );

    expect(screen.queryByText("이미지를 불러올 수 없어요")).not.toBeInTheDocument();
    expect(screen.getByAltText("다이어리 사진 1")).toHaveAttribute(
      "src",
      "https://media.example.test/refreshed.png"
    );
  });

  it("opens a lightbox with next/prev navigation when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const photos = [
      makePhoto({ id: "p1", displayOrder: 0, url: "https://media.example.test/photo-1.png" }),
      makePhoto({ id: "p2", displayOrder: 1, url: "https://media.example.test/photo-2.png" }),
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

  it("calls onPhotoLoadError when a thumbnail fails to load", () => {
    const onPhotoLoadError = jest.fn();
    render(<PhotoGallery photos={[makePhoto()]} onPhotoLoadError={onPhotoLoadError} />);

    fireEvent.error(screen.getByAltText("다이어리 사진 1"));

    expect(onPhotoLoadError).toHaveBeenCalledTimes(1);
  });

  it("closes the lightbox instead of crashing if the selected photo disappears", async () => {
    const user = userEvent.setup();
    const photos = [
      makePhoto({ id: "p1", displayOrder: 0 }),
      makePhoto({ id: "p2", displayOrder: 1 }),
    ];
    const { rerender } = render(<PhotoGallery photos={photos} />);

    await user.click(screen.getByRole("button", { name: "사진 2 크게 보기" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // Simulate the selected (second) photo being removed out from under the open lightbox.
    rerender(<PhotoGallery photos={[photos[0]]} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the lightbox on the same photo when the list is reordered", async () => {
    const user = userEvent.setup();
    const photos = [
      makePhoto({ id: "p1", displayOrder: 0, url: "https://media.example.test/photo-1.png" }),
      makePhoto({ id: "p2", displayOrder: 1, url: "https://media.example.test/photo-2.png" }),
    ];
    const { rerender } = render(<PhotoGallery photos={photos} />);

    await user.click(screen.getByRole("button", { name: "사진 1 크게 보기" }));
    expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute(
      "src",
      "https://media.example.test/photo-1.png"
    );

    // Reorder so p1 is now second; the lightbox should still show p1, not whatever is now at index 0.
    rerender(
      <PhotoGallery
        photos={[
          { ...photos[1], displayOrder: 0 },
          { ...photos[0], displayOrder: 1 },
        ]}
      />
    );

    expect(within(screen.getByRole("dialog")).getByRole("img")).toHaveAttribute(
      "src",
      "https://media.example.test/photo-1.png"
    );
  });

  it("uses a unique dialog title id per instance to avoid duplicate ids on the page", async () => {
    const user = userEvent.setup();
    render(
      <>
        <PhotoGallery photos={[makePhoto({ id: "p1" })]} />
        <PhotoGallery photos={[makePhoto({ id: "p2" })]} />
      </>
    );

    const openButtons = screen.getAllByRole("button", { name: "사진 1 크게 보기" });
    await user.click(openButtons[0]);
    await user.click(openButtons[1]);

    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs).toHaveLength(2);
    const labelledByIds = dialogs.map((dialog) => dialog.getAttribute("aria-labelledby"));

    expect(labelledByIds[0]).toBeTruthy();
    expect(labelledByIds[1]).toBeTruthy();
    expect(labelledByIds[0]).not.toEqual(labelledByIds[1]);
    labelledByIds.forEach((id) => {
      expect(document.getElementById(id!)).toBeInTheDocument();
    });
  });
});
