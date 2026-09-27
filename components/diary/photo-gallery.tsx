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
  className?: string;
}

const PhotoGallery = ({
  photos,
  canRemove = false,
  onRemove,
  removingPhotoId = null,
  className,
}: PhotoGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (photos.length === 0) return null;

  const orderedPhotos = [...photos].sort((a, b) => a.displayOrder - b.displayOrder);
  const selectedPhoto = selectedIndex !== null ? orderedPhotos[selectedIndex] : null;

  const showPrev = () =>
    setSelectedIndex((prev) =>
      prev === null ? prev : (prev - 1 + orderedPhotos.length) % orderedPhotos.length
    );
  const showNext = () =>
    setSelectedIndex((prev) => (prev === null ? prev : (prev + 1) % orderedPhotos.length));

  return (
    <div
      role="group"
      aria-label="첨부된 사진"
      className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}
    >
      {orderedPhotos.map((photo, index) => (
        <PhotoThumbnail
          key={photo.id}
          photo={photo}
          index={index}
          canRemove={canRemove}
          isRemoving={removingPhotoId === photo.id}
          onSelect={() => setSelectedIndex(index)}
          onRemove={(photoId) => onRemove?.(photoId)}
        />
      ))}

      <Dialog
        open={selectedPhoto !== null}
        onClose={() => setSelectedIndex(null)}
        className="max-w-2xl bg-transparent p-0 shadow-none"
        titleId="photo-gallery-dialog-title"
      >
        {selectedPhoto && (
          <div className="flex flex-col gap-3">
            <DialogHeader className="px-1">
              <DialogTitle id="photo-gallery-dialog-title" className="sr-only">
                사진 {(selectedIndex ?? 0) + 1} / {orderedPhotos.length}
              </DialogTitle>
              <DialogClose onClose={() => setSelectedIndex(null)} />
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
              {/* eslint-disable-next-line @next/next/no-img-element -- remote media served from a runtime-configured S3/CDN origin */}
              <img
                src={selectedPhoto.url}
                alt={`다이어리 사진 ${(selectedIndex ?? 0) + 1}`}
                className="max-h-[70vh] w-full rounded-lg object-contain"
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
