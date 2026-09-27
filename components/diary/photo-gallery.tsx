"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle, DialogClose, DialogBody } from "@/components/ui/dialog";
import { cn } from "@/lib/utils/tailwind.utils";
import type { DiaryPhoto } from "@/lib/api/diary";
import { PhotoThumbnail } from "./photo-thumbnail";

export interface PhotoGalleryProps {
  photos: DiaryPhoto[];
  /** Whether the current viewer may remove photos (owner only). */
  canRemove?: boolean;
  onRemove?: (photoId: string) => void;
  /** The id of a photo currently being removed, used to show a busy state. */
  removingPhotoId?: string | null;
  /**
   * Called when a photo thumbnail or the lightbox image fails to load, e.g. because
   * the backend's presigned view URL (valid for 15 minutes) has expired. Callers
   * should refetch the underlying query to obtain a freshly signed URL.
   */
  onPhotoLoadError?: () => void;
  className?: string;
}

const PhotoGallery = ({
  photos,
  canRemove = false,
  onRemove,
  removingPhotoId = null,
  onPhotoLoadError,
  className,
}: PhotoGalleryProps) => {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  if (photos.length === 0) return null;

  const orderedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const selectedIndex =
    selectedPhotoId === null
      ? -1
      : orderedPhotos.findIndex((photo) => photo.id === selectedPhotoId);
  const selectedPhoto = selectedIndex === -1 ? null : orderedPhotos[selectedIndex];

  const showPrev = () => {
    if (selectedIndex === -1) return;
    const nextIndex = (selectedIndex - 1 + orderedPhotos.length) % orderedPhotos.length;
    setSelectedPhotoId(orderedPhotos[nextIndex].id);
  };
  const showNext = () => {
    if (selectedIndex === -1) return;
    const nextIndex = (selectedIndex + 1) % orderedPhotos.length;
    setSelectedPhotoId(orderedPhotos[nextIndex].id);
  };

  return (
    <div
      role="group"
      aria-label="첨부된 사진"
      className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}
    >
      {orderedPhotos.map((photo, index) => (
        <PhotoThumbnail
          key={`${photo.id}:${photo.url}`}
          photo={photo}
          index={index}
          canRemove={canRemove}
          isRemoving={removingPhotoId === photo.id}
          onSelect={() => setSelectedPhotoId(photo.id)}
          onRemove={(photoId) => onRemove?.(photoId)}
          onLoadError={onPhotoLoadError}
        />
      ))}

      <Dialog
        open={selectedPhoto !== null}
        onClose={() => setSelectedPhotoId(null)}
        className="max-w-2xl bg-transparent p-0 shadow-none"
        titleId="photo-gallery-dialog-title"
      >
        {selectedPhoto && (
          <div className="flex flex-col gap-3">
            <DialogHeader className="px-1">
              <DialogTitle id="photo-gallery-dialog-title" className="sr-only">
                사진 {selectedIndex + 1} / {orderedPhotos.length}
              </DialogTitle>
              <DialogClose onClose={() => setSelectedPhotoId(null)} />
            </DialogHeader>
            <DialogBody className="relative flex items-center justify-center">
              {orderedPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={showPrev}
                  aria-label="이전 사진"
                  className="absolute left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element -- short-lived presigned S3 URL from the backend, unsuitable for next/image's remote-pattern allowlist */}
              <img
                src={selectedPhoto.url}
                alt={`다이어리 사진 ${selectedIndex + 1}`}
                className="max-h-[70vh] w-full rounded-lg object-contain"
                onError={onPhotoLoadError}
              />
              {orderedPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="다음 사진"
                  className="absolute right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </DialogBody>
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
